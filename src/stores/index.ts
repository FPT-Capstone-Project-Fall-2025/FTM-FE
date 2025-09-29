import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from 'redux-persist/lib/storage';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import authReducer from "./slices/authSlice";
import familyTreeReducer from "./slices/familyTreeSlice";

const rootReducer = combineReducers({
    // more reducers go here
    auth: authReducer,
    familyTree: familyTreeReducer
});

const persistConfig = {
    key: 'root',
    storage,
    whitelist: [
        // reducers you want to persist here
    ],
    blacklist: [
        // don't persist
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