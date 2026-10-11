import React from 'react'
import { Row, Col } from 'antd';
import classes from './Footer.module.scss';
const Footer = () => {
  return (
    <div className={`container ${classes.footer}`}>
      <Row>
        <Col span={24} style={{ textAlign: "center" }}>
          <p className={classes.footerText} style={{ margin: "0.2rem 0", fontWeight: 500 }}>
            SmartCampus (DigiCampus) · Proxy Free QR-Based Attendance Platform
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#a0a5ad" }}>
            National Level Hackathon Winner (Pragyaa @ SGGS Engineering College Nanded) · Team Phantom Troupe
          </p>
        </Col>
      </Row>
    </div>
  );
}

export default Footer