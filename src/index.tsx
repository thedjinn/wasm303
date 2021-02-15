import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import App from "./App";
import Engine from "./Engine";
import rootReducer from "./reducers";

const engine = new Engine();

const store = configureStore({
    reducer: rootReducer
});

ReactDOM.render(
    <Provider store={store}>
        <App engine={engine} />
    </Provider>,
    document.getElementById("root")
);
