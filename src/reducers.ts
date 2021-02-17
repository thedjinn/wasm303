import { combineReducers } from "@reduxjs/toolkit";

import r303Reducer from "./reducers/r303";

const rootReducer = combineReducers({
    r303: r303Reducer
});

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer;
