import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './stores'
import { AppRouter } from './routes/AppRouter';
import { useAuthInitialization } from './hooks/useAuth';
import { ToastContainer } from 'react-toastify';
import LoadingScreen from './components/ui/LoadingScreen'
import { useAppDispatch, useAppSelector } from './hooks/redux';
import "@fontsource/montserrat";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import { setConnectionStatus } from './stores/slices/connectionSlice';
import { stopNotificationHub } from './services/hub/notificationHub';
import notificationService from './services/notificationService';
import { setNotifications } from './stores/slices/notificationSlice';


// App content component that uses auth hooks and applies settings
const AppContent: React.FC = () => {

  useAuthInitialization()
  const { fontSize } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token)

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const res = await notificationService.getNotifications();
        if (res.data) {
          dispatch(setNotifications(res.data));
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    if (token) {
      dispatch(setConnectionStatus("Connecting"));
      fetchNotifications();
      notificationService.init(token, dispatch);
    }
    return () => {
      stopNotificationHub();
    };
  }, [token, dispatch]);

  return <AppRouter />
}

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </PersistGate>
    </Provider>
  )
}

export default App