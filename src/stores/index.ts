import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from 'redux-persist/lib/storage';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import authReducer from "./slices/authSlice";
import familyTreeReducer from "./slices/familyTreeSlice";
import familyTreeMetaReducer from "./slices/familyTreeMetaDataSlice";
import settingsReducer from "./slices/settingsSlice";
import notificationReducer from "./slices/notificationSlice";
import connectionReducer from "./slices/connectionSlice";

const rootReducer = combineReducers({
    // more reducers go here
    auth: authReducer,
    familyTree: familyTreeReducer,
    familyTreeMetaData: familyTreeMetaReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
    connection: connectionReducer,
});

const persistConfig = {
    key: 'root',
    storage,
    whitelist: [
        // reducers to persist
        'auth',
        'familyTreeMetaData',
        'settings',
        'notifications'
    ],
    blacklist: [
        // reducers not to persist
    ]
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleWare) =>
        getDefaultMiddleWare({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch