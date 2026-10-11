import { Row, Col, Menu, Alert, Button } from "antd";
import React, { useEffect, useState } from "react";
import classes from "./index.module.scss";
import CreateAttendance from "./CreateAttendance";
import AddStudent from "./AddStudent";
import db from "../../firebase";
import { useSelector, useDispatch } from "react-redux";
import { loginActions } from "../../redux/redux";
import ViewAttendance from "./ViewAttendance";

const ITEMS = [
  { key: "add_student", label: "Add Student" },
  { key: "create_attendance", label: "Create Attendance" },
  { key: "view_attendance", label: "View Attendance Records" },
];

const Teacher = () => {
  const [checkMenu, setCheckMenu] = useState("add_student");
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [docID, setDocID] = useState(user?.uid || null);

  // Manage window resize responsiveness
  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", updateWindowDimensions);
    return () => window.removeEventListener("resize", updateWindowDimensions);
  }, []);

  // Safely retrieve or initialize docID in Firestore
  useEffect(() => {
    if (!user || !user.email) {
      setDocID(null);
      return;
    }

    const email = user.email;
    const usersRef = db.collection("users");

    usersRef
      .where("email", "==", email)
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            setDocID(doc.id);
          });
        } else {
          // If the user document does not exist yet, create it with user.uid
          const newId = user.uid || `user_${Date.now()}`;
          usersRef
            .doc(newId)
            .set({ email })
            .then(() => setDocID(newId))
            .catch(() => setDocID(newId));
        }
      })
      .catch((error) => {
        console.error("Error retrieving user document from Firestore:", error);
        // Fallback to user.uid or demo id so teacher actions don't crash
        setDocID(user.uid || "demo_teacher_sggs");
      });
  }, [user]);

  const onClick = (e) => {
    setCheckMenu(e.key);
  };

  const handleQuickDemoLogin = () => {
    const demoUser = {
      uid: "demo_teacher_sggs",
      displayName: "Prof. Sharma (SGGS CSE)",
      email: "teacher.cse@sggs.ac.in",
    };
    dispatch(loginActions.login({ user: demoUser }));
  };

  // If user is not logged in, show helpful prompt with 1-click Demo Login
  if (!user) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <Alert
          message="Teacher Authentication Required"
          description={
            <div>
              <p style={{ marginTop: "0.5rem" }}>
                You must be logged in as a faculty/teacher to add students, create dynamic QR sessions, and view attendance logs.
              </p>
              <Button
                type="primary"
                style={{ marginTop: "0.8rem" }}
                onClick={handleQuickDemoLogin}
              >
                Log In as Demo Teacher
              </Button>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <Row gutter={[15]}>
      <Col span={5} sm={9} lg={5} xs={24}>
        <Menu
          onClick={onClick}
          selectedKeys={[checkMenu]}
          mode={windowWidth <= 576 ? "horizontal" : "vertical"}
          items={ITEMS}
          defaultActiveFirst={["add_student"]}
          className={classes.teacherMenu}
        />
      </Col>
      <Col span={19} sm={15} lg={19} xs={24}>
        {checkMenu === "add_student" && <AddStudent docID={docID || user?.uid} />}
        {checkMenu === "create_attendance" && (
          <CreateAttendance docID={docID || user?.uid} />
        )}
        {checkMenu === "view_attendance" && <ViewAttendance />}
      </Col>
    </Row>
  );
};

export default Teacher;
