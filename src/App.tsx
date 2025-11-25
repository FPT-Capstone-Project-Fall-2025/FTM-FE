import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './stores'
import { AppRouter } from './routes/AppRouter';
import { useAuthInitialization } from './hooks/useAuth';
import { ToastContainer, toast } from 'react-toastify';
import LoadingScreen from './components/ui/LoadingScreen'
import { useAppDispatch, useAppSelector } from './hooks/redux';
import "@fontsource/montserrat";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import { logout } from './stores/slices/authSlice';
import { stopNotificationHub, initNotificationHub } from './services/hub/notificationHub';
import notificationService from './services/notificationService';
import { setNotifications } from './stores/slices/notificationSlice';
import authService from './services/authService';


// App content component that uses auth hooks and applies settings
const AppContent: React.FC = () => {

  useAuthInitialization()
  const { fontSize } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token)

  // Check token expiration on app load
  useEffect(() => {
    const checkTokenExpiration = async () => {
      if (!token) return;

      try {
        const response = await authService.isTokenExpired(token);
        if (response.data.isTokenExpired) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          dispatch(logout());
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        toast.error('Lỗi xác thực. Vui lòng đăng nhập lại.');
        dispatch(logout());
      }
    };

    checkTokenExpiration();
  }, []);

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

  // Initialize notifications and SignalR connection
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!token) return;

      try {
        // Fetch initial notifications
        const res = await notificationService.getNotifications();
        if (res.data) {
          dispatch(setNotifications(res.data));
        }

        // Initialize SignalR connection
        await initNotificationHub(token, dispatch);
      } catch (err) {
        console.error("Error initializing notifications:", err);
      }
    };

    if (token) {
      initializeNotifications();
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