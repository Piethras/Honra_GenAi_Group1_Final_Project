from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from services.loader import load_dataframe
from services.llm import generate_model_explanation

router = APIRouter()


class ModelRequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"
    targetColumn: str
    modelType: str  # "regression" or "classification"
    featureColumns: list[str] = []


@router.post("/train")
async def train_model(req: ModelRequest):
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    # Validate target column
    if req.targetColumn not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.targetColumn}' not found")

    # Select feature columns
    if req.featureColumns:
        features = [c for c in req.featureColumns if c in df.columns]
    else:
        features = [c for c in df.columns if c != req.targetColumn]

    # Keep only numeric columns for features
    numeric_features = [c for c in features if pd.api.types.is_numeric_dtype(df[c])]

    if not numeric_features:
        raise HTTPException(status_code=400, detail="No numeric feature columns found")

    # Drop rows with missing values
    model_df = df[numeric_features + [req.targetColumn]].dropna()

    if len(model_df) < 10:
        raise HTTPException(status_code=400, detail="Not enough data after removing missing values")

    X = model_df[numeric_features].values
    y = model_df[req.targetColumn].values

    # Simple train/test split (80/20)
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    results = {}

    if req.modelType == "regression":
        # Simple linear regression using numpy
        try:
            # Add bias column
            X_train_b = np.column_stack([np.ones(len(X_train)), X_train])
            X_test_b = np.column_stack([np.ones(len(X_test)), X_test])

            # Normal equation
            coeffs = np.linalg.lstsq(X_train_b, y_train, rcond=None)[0]
            y_pred = X_test_b @ coeffs

            # Metrics
            ss_res = np.sum((y_test - y_pred) ** 2)
            ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
            rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))

            # Feature importance (absolute coefficients, skip bias)
            importance = []
            for i, col in enumerate(numeric_features):
                importance.append({
                    "feature": col,
                    "importance": round(abs(float(coeffs[i + 1])), 4),
                })
            importance = sorted(importance, key=lambda x: x["importance"], reverse=True)

            # Prediction samples
            samples = []
            for i in range(min(10, len(X_test))):
                samples.append({
                    "actual": round(float(y_test[i]), 2),
                    "predicted": round(float(y_pred[i]), 2),
                })

            results = {
                "modelType": "Linear Regression",
                "r2Score": round(float(r2), 4),
                "rmse": round(rmse, 4),
                "trainSize": len(X_train),
                "testSize": len(X_test),
                "featureImportance": importance,
                "predictionSamples": samples,
                "targetColumn": req.targetColumn,
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Regression failed: {e}")

    elif req.modelType == "classification":
        try:
            # Encode target to numeric if needed
            unique_vals = pd.Series(y).unique()
            if len(unique_vals) > 10:
                raise HTTPException(status_code=400, detail="Too many categories for classification (max 10)")

            val_map = {v: i for i, v in enumerate(unique_vals)}
            y_encoded = np.array([val_map[v] for v in y])
            y_train_enc = y_encoded[:split]
            y_test_enc = y_encoded[split:]

            # Naive nearest centroid classifier
            centroids = {}
            for cls in np.unique(y_train_enc):
                mask = y_train_enc == cls
                centroids[cls] = X_train[mask].mean(axis=0)

            y_pred_enc = np.array([
                min(centroids.keys(), key=lambda c: np.linalg.norm(x - centroids[c]))
                for x in X_test
            ])

            accuracy = float(np.mean(y_pred_enc == y_test_enc))

            # Class distribution
            reverse_map = {v: k for k, v in val_map.items()}
            class_dist = []
            for cls, idx in val_map.items():
                count = int(np.sum(y == cls))
                class_dist.append({"class": str(cls), "count": count})

            # Feature importance (variance between class centroids)
            importance = []
            if len(centroids) > 1:
                centroid_array = np.array(list(centroids.values()))
                variances = centroid_array.var(axis=0)
                for i, col in enumerate(numeric_features):
                    importance.append({
                        "feature": col,
                        "importance": round(float(variances[i]), 4),
                    })
                importance = sorted(importance, key=lambda x: x["importance"], reverse=True)

            results = {
                "modelType": "Nearest Centroid Classification",
                "accuracy": round(accuracy * 100, 2),
                "trainSize": len(X_train),
                "testSize": len(X_test),
                "classes": [str(v) for v in unique_vals],
                "classDistribution": class_dist,
                "featureImportance": importance,
                "targetColumn": req.targetColumn,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Classification failed: {e}")

    else:
        raise HTTPException(status_code=400, detail="modelType must be 'regression' or 'classification'")

    # Generate AI explanation
    try:
        explanation = generate_model_explanation(results)
        results["explanation"] = explanation
    except Exception:
        results["explanation"] = "Model trained successfully."

    return results