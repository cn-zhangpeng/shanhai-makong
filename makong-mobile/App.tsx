import { mount, View } from "nsh";
import { NavStack } from "nsh/base";
import { nav } from "./src/nav";
import { ToastHost } from "./src/overlays";
import { ScannerDialog } from "./src/scanner/scanner";
import { Edit } from "./src/screens/Edit";
import { Home } from "./src/screens/Home";
import { WebPage } from "./src/screens/WebPage";
import { loadStore } from "./src/store";
import { C } from "./src/theme";

loadStore();

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <NavStack state={nav} style={{ flex: 1 }}>
        {(route) => {
          if (route.name === "edit") {
            return <Edit id={route.id} url={route.url} title={route.title} />;
          }
          if (route.name === "web") {
            return <WebPage id={route.id} />;
          }
          return <Home />;
        }}
      </NavStack>
      <ScannerDialog />
      <ToastHost />
    </View>
  );
}

mount(App);
