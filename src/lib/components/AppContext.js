import { createContext, useContext, useEffect, useState } from "react";
import DgtTestTrainer from "../DgtTestTrainer";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [app] = useState(() => new DgtTestTrainer());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    app.init().then(() => setLoading(false));
  }, [app]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        Cargando aplicación...
      </div>
    );
  }

  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
