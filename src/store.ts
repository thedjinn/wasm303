import { configureStore, Action } from "@reduxjs/toolkit";
import { ThunkAction } from "redux-thunk";

import Engine from "./Engine";
import rootReducer, { RootState } from "./reducers";

export type Thunk<ReturnValue = void> = ThunkAction<ReturnValue, RootState, Engine, Action<string>>;

const engine = new Engine();

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        thunk: {
            extraArgument: engine
        }
    })
});

export default store;
