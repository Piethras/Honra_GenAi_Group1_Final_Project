// IMPLEMENT: Dashboard layout (wraps all protected pages)
// - Render the Sidebar component on the left
// - Render the TopBar / Header component at the top
// - Main content area fills the remaining space
// - All routes inside this layout are protected by Clerk middleware
// - If user has an active org (Clerk), show org context in the sidebar
