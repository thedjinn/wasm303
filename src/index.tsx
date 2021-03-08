import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import App from "./App";
import SVGFilters from "./SVGFilters";
import store from "./store";

ReactDOM.render(
    <Provider store={store}>
        <SVGFilters />
        <App />
    </Provider>,
    document.getElementById("root")
);
