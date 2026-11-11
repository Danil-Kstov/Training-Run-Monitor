import Header from "../components/Header/Header.tsx";
import Main from "../components/Main/Main.tsx";
import Footer from "../components/Footer/Footer.tsx";
import './Layout.css'

function Layout() {

  return (
      <div className="app">
          <Header />
          <Main />
          <Footer />
      </div>
  )
}

export default Layout
