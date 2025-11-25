# Amelie Coffee & Bakery - Frontend Structure

## 📁 Directory Structure

```
src/
├── components/          # React components
│   ├── cart/          # Shopping cart components
│   ├── menu/          # Menu and product display components
│   ├── products/      # Product card components
│   ├── supervisor/    # Supervisor/admin components
│   ├── views/         # Main view components (GuestView, etc.)
│   └── ...            # Other shared components
├── contexts/          # React Context providers
│   ├── LanguageContext.jsx  # Multi-language support
│   └── translations.js      # Translation strings
├── hooks/            # Custom React hooks
│   ├── useProducts.js # Products data management
│   └── useCart.js     # Shopping cart logic
├── utils/            # Utility functions
│   ├── api.js        # API request helpers
│   ├── scroll.js     # Smooth scrolling utilities
│   └── storage.js    # LocalStorage helpers
├── App.jsx           # Main application component
└── main.jsx          # Application entry point
```

## 🎯 Key Components

### App.jsx
Main application component that:
- Manages view state (guest/supervisor)
- Coordinates data fetching
- Handles navigation and routing
- Manages supervisor authentication

### GuestView
Customer-facing interface with:
- Product menu
- Shopping cart
- Order form

### Hooks

#### `useProducts()`
Manages products data:
- Fetches products from API
- Handles loading and error states
- Provides refetch function

#### `useCart()`
Manages shopping cart:
- Add/remove/update items
- Toast notifications
- Cart animations

### Utils

#### `api.js`
Centralized API functions:
- `apiGet(endpoint, token?)`
- `apiPost(endpoint, data, token?)`
- `apiPatch(endpoint, data, token?)`
- `apiDelete(endpoint, token?)`

#### `scroll.js`
Smooth scrolling utilities:
- `smoothScrollToElement(element, offset, duration)`
- `scrollToElementById(elementId, offset)`

#### `storage.js`
LocalStorage helpers:
- `loadSupervisorToken()`
- `saveSupervisorToken(token)`
- `clearSupervisorData()`

## 🌍 Internationalization

All user-facing text is stored in `contexts/translations.js` with support for:
- English
- Georgian (ქართული)
- Armenian (Հայերեն)
- Russian (Русский)

Use the `useLanguage()` hook to access translations:
```jsx
const { t, language, changeLanguage } = useLanguage();
const text = t("menu.title");
```

## 🔄 Data Flow

1. **Products**: `useProducts()` hook → API → State → Components
2. **Cart**: `useCart()` hook → Local state → Components
3. **Orders**: App.jsx → API → State → SupervisorSection
4. **Consumables**: App.jsx → API → State → ExpensesReport

## 📝 Code Style

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components focused and small
- Use utility functions for common operations
- Add JSDoc comments for complex functions

## 🚀 Adding New Features

1. **New Component**: Add to appropriate directory in `components/`
2. **New Hook**: Add to `hooks/` directory
3. **New Utility**: Add to `utils/` directory
4. **New Translation**: Add keys to all languages in `translations.js`

## 🔧 Common Patterns

### API Calls
```jsx
import { apiGet, apiPost } from "../utils/api.js";

// GET request
const data = await apiGet("/endpoint", token);

// POST request
const result = await apiPost("/endpoint", payload, token);
```

### Smooth Scrolling
```jsx
import { scrollToElementById } from "../utils/scroll.js";

scrollToElementById("section-id", 140);
```

### Translations
```jsx
import { useLanguage } from "../contexts/LanguageContext.jsx";

const { t } = useLanguage();
const message = t("cart.title");
```

