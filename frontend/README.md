# Zettelkasten Frontend

A modern, modular React TypeScript application for building and searching your personal knowledge base.

## 🏗️ Architecture

This application follows best practices for React development with a focus on modularity, reusability, and maintainability.

### Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, Card)
│   ├── layout/         # Layout components (Header)
│   ├── auth/           # Authentication components
│   ├── search/         # Search-related components
│   ├── upload/         # File upload components
│   ├── documents/      # Document management components
│   ├── dashboard/      # Dashboard-specific components
│   └── analytics/      # Analytics components
├── hooks/              # Custom React hooks
│   ├── useTheme.ts     # Theme management
│   ├── useAuth.ts      # Authentication logic
│   └── useApi.ts       # API operations
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   └── DashboardPage.tsx
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and constants
└── App.tsx             # Main application component
```

## 🎯 Design Principles

### Single Responsibility Principle
Each component has one clear purpose:
- **UI Components**: Handle presentation and basic interactions
- **Page Components**: Orchestrate layout and data flow
- **Custom Hooks**: Manage specific pieces of state and logic
- **Utility Functions**: Handle pure functions and constants

### Composition over Inheritance
Components are built using composition patterns:
- Props-based configuration
- Children prop for flexible layouts
- Higher-order patterns through custom hooks

### Custom Hooks for Logic Separation
Complex logic is extracted into custom hooks:
- `useTheme`: Theme state and persistence
- `useAuth`: Authentication state and API calls
- `useApi`: Centralized API operations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables** (optional):
   ```bash
   # Create a .env file in the frontend directory
   echo "REACT_APP_API_URL=http://localhost:8080/v1" > .env
   ```
   
   Available environment variables:
   - `REACT_APP_API_URL`: Backend API URL (defaults to `http://localhost:8080/v1`)

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🧩 Component Usage

### UI Components

```tsx
import { Button, Input, Card } from './components/ui';

// Button with different variants
<Button variant="primary" size="lg" theme={theme} onClick={handleClick}>
  Click me
</Button>

// Input with validation
<Input 
  theme={theme}
  label="Email"
  type="email"
  error={errors.email}
  onChange={handleChange}
/>

// Card container
<Card theme={theme} variant="bordered">
  <h2>Card Content</h2>
</Card>
```

### Custom Hooks

```tsx
import { useTheme, useAuth, useApi } from './hooks';

function MyComponent() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { authState, authenticate, logout } = useAuth();
  const api = useApi(authState.token);
  
  // Use the hooks...
}
```

## 🎨 Theming

The application uses a centralized theming system:

```tsx
const theme = {
  bg: isDarkMode ? 'bg-black' : 'bg-white',
  text: isDarkMode ? 'text-white' : 'text-gray-900',
  // ... other theme properties
};
```

All components accept a `theme` prop for consistent styling.

## 📡 API Integration

API calls are centralized in the `useApi` hook:

```tsx
const api = useApi(token);

// Search
const results = await api.search({ query: 'my search' });

// Upload documents
await api.uploadDocuments({ files, source_type: 'notion' });

// Get documents
const documents = await api.getDocuments();
```

## 🔒 Authentication

Authentication is handled by the `useAuth` hook:

```tsx
const { authState, authenticate, logout } = useAuth();

// Login
await authenticate('login', { email, password });

// Signup
await authenticate('signup', { email, password, name });

// Logout
logout();
```

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Responsive navigation with mobile menu
- Adaptive layouts using CSS Grid and Flexbox
- Touch-friendly interactions

## 🧪 Testing

```bash
npm test
```

## 🚀 Deployment

```bash
npm run build
```

The build folder contains the production-ready application.

## 🤝 Contributing

1. Follow the established component structure
2. Use TypeScript for type safety
3. Extract complex logic into custom hooks
4. Maintain single responsibility for components
5. Use composition patterns for flexibility

## 📄 License

This project is licensed under the MIT License. 