# Product Admin Dashboard

A Next.js (App Router) based frontend admin dashboard built to manage products using the DummyJSON API.

## Features

- **Authentication**: Secured login using DummyJSON credentials (`emilys` / `emilyspass`).
- **Product List**: Responsive layout with a data table for desktop and cards for mobile view.
- **Pagination**: Fully integrated server-side (API) pagination that stays synchronized with URL parameters.
- **Search & Filtering**: Search products by keyword (debounced) or filter by category. (Note: DummyJSON does not support simultaneous search and category filtering; the UI automatically resolves this by clearing the category when searching).
- **Sorting**: Sort products by price, rating, or title.
- **URL State Management**: All list state (pagination, search, filter, sort) is persisted in the URL so that the page can be refreshed or shared without losing state.
- **CRUD Operations**: View product details, add new products, edit existing ones, and delete them.
- **Optimistic UI Updates**: Because the DummyJSON API does not persist Add, Edit, or Delete mutations, a global React Context (`ProductStoreContext`) is used to store local modifications. These local changes override the API data to provide a seamless user experience.

## Setup Steps

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd product-admin-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the login page.

## Testing Credentials

- **Username**: `emilys`
- **Password**: `emilyspass`

---

## Technical Choices & Explanations

### 1. State Management & Optimistic Updates
**Choice**: I chose to use a custom React Context (`ProductStoreContext`) to handle optimistic UI updates rather than installing Redux or Zustand. 
**Explanation**: The DummyJSON API is read-only for mutations (POST, PUT, DELETE). To satisfy the requirement of showing changes anyway across different pages (e.g., editing on the details page and seeing the change on the list page), the app needed a global state to track `addedProducts`, `editedProducts`, and `deletedProductIds`. This state is merged with the API response dynamically.

### 2. URL State Synchronization
**Choice**: Utilized `next/navigation` hooks (`useSearchParams`, `useRouter`, `usePathname`).
**Explanation**: Rather than storing the current page, limit, or search query in `useState`, they are read directly from the URL. When a user interacts with the UI, the URL is updated. This ensures the back button works intuitively and URLs are shareable.

### 3. Data Fetching
**Choice**: Standard `useEffect` with an `axios` interceptor setup (no React Query/SWR).
**Explanation**: The rules explicitly prohibited libraries like React Query. The custom Axios instance automatically intercepts requests to attach the Bearer token from `localStorage` and handles global error logging. The component-level `useEffect` fetches data and applies local mutations.

### One Problem Faced & How It Was Fixed
**Problem**: The API does not allow searching and filtering by category at the same time. If a user was viewing the "smartphones" category and searched for "samsung", the API would fail or return unexpected results.
**Fix**: I implemented logic in the URL updater and `page.tsx` that automatically clears the `category` state if the user begins typing a search query, and vice-versa. I also added a subtle warning message in the UI to explain this limitation to the user so they understand why their category filter was cleared.

### AI Assistance
AI was utilized to quickly scaffold the Next.js App Router structure, generate the responsive Tailwind CSS layouts (like the table and mobile cards), and outline the logic for the `ProductStoreContext` to handle optimistic updates seamlessly. This accelerated development time while ensuring strict adherence to the assignment rules.
