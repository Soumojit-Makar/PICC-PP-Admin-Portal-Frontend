import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const LoaderContext = createContext({
  showLoader: () => {},
  hideLoader: () => {},
});

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);

  // 1. Wrap functions in useCallback so their memory reference NEVER changes
  const showLoader = useCallback(() => setLoading(true), []);
  const hideLoader = useCallback(() => setLoading(false), []);

  // 2. Wrap the context value in useMemo so the provider doesn't trigger unnecessary re-renders
  const contextValue = useMemo(() => ({ showLoader, hideLoader }), [showLoader, hideLoader]);

  return (
    <LoaderContext.Provider value={contextValue}>
      {children}

      {/* Global Backdrop Loader */}
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </LoaderContext.Provider>
  );
};