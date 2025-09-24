import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './stores'
import { AppRouter } from './routes/AppRouter';
import { useAuthInitialization } from './hooks/useAuth'
import LoadingScreen from './components/ui/LoadingScreen'
import "@fontsource/montserrat";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";


// App content component that uses auth hooks
const AppContent: React.FC = () => {
  useAuthInitialization()
  return <AppRouter />
}

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  )
}

export default App