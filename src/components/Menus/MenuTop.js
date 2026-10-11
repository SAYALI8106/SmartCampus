import React, { useEffect, useState } from "react";
import { Button, Col, Menu, Row, notification } from "antd";
import { MENU_ITEMS } from "../../utils/menu";
import classes from "./MenuTop.module.scss";
import { MenuOutlined, CloseOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../../firebase";
import { useDispatch, useSelector } from "react-redux";
import { loginActions } from "../../redux/redux";
import db from "../../firebase";
import applogo from "./applogo.png";

const MenuTop = (props) => {
  const user = useSelector((state) => state.user);
  const isLoginned = Boolean(user);
  const [current, setCurrent] = useState("/");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [toggleMenu, setToggleMenu] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Listen to screen width changes for responsive layout
  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", updateWindowDimensions);
    return () => window.removeEventListener("resize", updateWindowDimensions);
  }, []);

  // Sync Firebase Auth state with Redux store on reload
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && !user) {
        dispatch(loginActions.login({ user: currentUser }));
      }
    });
    return () => unsubscribe();
  }, [dispatch, user]);

  // Google Sign-In with Firebase
  const signIn = () => {
    auth
      .signInWithPopup(provider)
      .then((result) => {
        const loggedUser = result.user;
        const email = loggedUser.email;
        const usersRef = db.collection("users");

        usersRef
          .where("email", "==", email)
          .get()
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              usersRef
                .doc(loggedUser.uid)
                .set({ email })
                .then(() => console.log("Email added to users collection"))
                .catch((err) => console.error("Error setting user document:", err));
            }
          })
          .catch((err) => console.error("Error querying users collection:", err));

        dispatch(loginActions.login({ user: loggedUser }));
        notification.success({
          message: "Login Successful",
          description: `Welcome ${loggedUser.displayName || email}!`,
        });
      })
      .catch((error) => {
        console.error("Auth error:", error);
        notification.error({
          message: "Google Login Issue",
          description:
            error.message +
            " Note: You can use 'Demo Login' for instant local evaluation.",
        });
      });
  };

  // Quick Demo Login for testing and offline/local environment
  const loginDemo = () => {
    const demoUser = {
      uid: "demo_teacher_sggs",
      displayName: "Prof. Sharma (SGGS CSE)",
      email: "teacher.cse@sggs.ac.in",
    };
    dispatch(loginActions.login({ user: demoUser }));

    // Ensure demo document exists in Firestore for student / attendance records
    db.collection("users")
      .doc(demoUser.uid)
      .set({ email: demoUser.email }, { merge: true })
      .catch((err) => console.log("Demo user firestore init:", err));

    notification.success({
      message: "Logged in as Demo Teacher",
      description: "Full teacher & attendance features unlocked.",
    });
  };

  // Sign out handler
  const handleLogout = () => {
    auth.signOut().catch((err) => console.log("Signout err:", err));
    dispatch(loginActions.login({ user: null }));
    notification.info({
      message: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  // Navigation click handler
  const onClick = (e) => {
    if ((e.key === "pages/attendance" || e.key === "/attendance") && !user) {
      notification.warning({
        message: "Login Required",
        description: "Please login with Google or Demo Login to access Attendance.",
      });
      return;
    }
    const dest = e.key.startsWith("/") ? e.key : `/${e.key}`;
    navigate(dest);
    setCurrent(e.key);
  };

  // Responsive column spans
  let logoSpan = 5,
    buttonSpan = 7,
    menuSpan = 12;

  if (windowWidth > 930 && windowWidth <= 1200) {
    logoSpan = 16;
    menuSpan = 16;
    buttonSpan = 8;
  } else if (windowWidth < 930) {
    logoSpan = 12;
    buttonSpan = 10;
  }

  return (
    <div>
      <div
        className={`${windowWidth > 930 && classes.stickMenu} ${
          classes.menuTop
        }`}
      >
        <Row align="middle">
          <Col
            span={4}
            lg={4}
            sm={3}
            xs={windowWidth > 320 ? 4 : 5}
            className={classes.menuButton}
          >
            <Button
              onClick={() => setToggleMenu(true)}
              className={classes.menuButtonIcon}
              style={{ marginBottom: 16 }}
            >
              <MenuOutlined />
            </Button>
          </Col>
          <Col
            span={logoSpan}
            md={logoSpan}
            sm={12}
            xs={windowWidth > 320 ? 10 : 9}
          >
            <img
              src={applogo}
              alt="app logo"
              className={classes.appLogo}
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            />
          </Col>
          <Col
            span={menuSpan}
            sm={menuSpan}
            xs={24}
            className={`${classes.upperMenu} ${
              toggleMenu ? classes.showMenu : classes.hideMenu
            }`}
          >
            <CloseOutlined
              className={classes.closeIcon}
              onClick={() => setToggleMenu(false)}
            />
            <Menu
              className={classes.menuWithItems}
              onClick={onClick}
              selectedKeys={[current]}
              defaultActiveFirst={["/"]}
              mode={windowWidth <= 930 ? "inline" : "horizontal"}
              items={MENU_ITEMS}
            />
          </Col>
          <Col
            span={buttonSpan}
            md={buttonSpan}
            sm={9}
            xs={10}
            className={classes.buttonArea}
          >
            {isLoginned ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <strong className={classes.user}>
                  {user.displayName || user.email || "Teacher"}
                </strong>
                <LogoutOutlined
                  className={classes.logOut}
                  title="Logout"
                  onClick={handleLogout}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size={windowWidth <= 930 ? "small" : "middle"}
                  className={classes.exploreButton}
                  onClick={signIn}
                  type="primary"
                >
                  Google Login
                </Button>
                <Button
                  size={windowWidth <= 930 ? "small" : "middle"}
                  onClick={loginDemo}
                  style={{
                    borderColor: "var(--primary-color)",
                    color: "var(--primary-color)",
                    background: "transparent",
                  }}
                >
                  Demo Login
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </div>
      {props.children}
    </div>
  );
};

export default MenuTop;
