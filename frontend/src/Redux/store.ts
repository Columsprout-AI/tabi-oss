import { configureStore } from "@reduxjs/toolkit";
import uploadFileReducer from "./Upload/uploadFileSlice";
import experimentSlice from "./Experiment/experimentSlice";
import recordUserRemarkReducer from "./Remark/remarkSlice";
import estimateCreditsReducer from "./Credits/creditSlice";
import creditsReducer from "./Credits/userCredit";
import startProcessingReducer from "./Processing/processingSlice";
import ingestionSlice from "./Ingestion/ingestionSlice";
import razorpayReducer from "./Razorpay/index";
import recordExportReducer from "./Exports/exportSlice";
import authReducer from "./Auth/slice";

export const store = configureStore({
  reducer: {
    uploadFile: uploadFileReducer,
    experiment: experimentSlice,
    recordUserRemark: recordUserRemarkReducer,
    estimateCredits: estimateCreditsReducer,
    startProcessing: startProcessingReducer,
    ingestion: ingestionSlice,
    recordExport: recordExportReducer,
    auth: authReducer,
    razorpay: razorpayReducer,
    credits: creditsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
