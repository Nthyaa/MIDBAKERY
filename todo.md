# Bakery Website - Project TODO

## Design & Branding
- [x] Generate hand-drawn sketch aesthetic brand assets (logo, icons, decorative elements)
- [x] Create texture/background images with warm cream paper aesthetic
- [x] Design sketch-style dividers and decorative elements
- [x] Establish color palette (warm creams, charcoal, earthy tones)
- [x] Define typography system (marker-style headers, monospaced typewriter fonts)

## Database & Schema
- [x] Create menu_items table (name, description, image_url, price, available)
- [x] Create discounts table (item_id, discount_percentage, active, start_date, end_date)
- [x] Create orders table (user_id, total_price, status, created_at)
- [x] Create order_items table (order_id, menu_item_id, quantity, price_at_purchase)
- [x] Create cart_items table (user_id, menu_item_id, quantity)
- [x] Run database migrations and verify schema

## Authentication & User Management
- [x] Implement Manus OAuth sign-up flow (built-in to template)
- [x] Implement Manus OAuth sign-in flow (built-in to template)
- [x] Create user profile page (view account details)
- [x] Implement logout functionality (built-in to template)
- [x] Protect authenticated routes and procedures

## Public Pages - Core UI
- [x] Build Home/Landing page with bakery introduction and CTA
- [x] Build Today's Menu page displaying all available items
- [x] Build Discounts/Promotions page highlighting 2/3 off deals
- [x] Implement hand-drawn sketch aesthetic styling across all pages
- [x] Create responsive navigation with sketch-style design

## Shopping Cart & Checkout
- [x] Implement add-to-cart functionality
- [x] Build Shopping Cart page with item review and quantity adjustment
- [x] Implement remove-from-cart functionality
- [x] Create order summary with total calculation
- [x] Build checkout flow (order placement form)
- [x] Implement order confirmation page

## Order Management (User)
- [x] Create My Orders page showing order history
- [x] Display order status (pending, confirmed, ready, completed)
- [x] Show order details with items and timestamps
- [x] Implement order tracking/status updates

## Admin Panel
- [x] Build admin dashboard layout with sidebar navigation
- [x] Create Menu Management section (add, edit, delete items)
- [x] Create Discount Management section (create, edit, delete promotions)
- [x] Create Orders Management section (view all orders, update status)
- [x] Implement admin-only access control
- [x] Add order status update functionality
- [x] Create admin analytics/overview dashboard

## Testing & Quality
- [x] Write vitest tests for authentication flows
- [x] Write vitest tests for cart operations
- [x] Write vitest tests for order creation and updates
- [x] Write vitest tests for admin operations
- [x] Manual testing of complete user journey
- [x] Manual testing of complete admin journey

## Deployment & Finalization
- [x] Verify all features working end-to-end
- [x] Test responsive design on mobile/tablet/desktop
- [x] Optimize performance and loading times
- [x] Create final checkpoint and prepare for publication
