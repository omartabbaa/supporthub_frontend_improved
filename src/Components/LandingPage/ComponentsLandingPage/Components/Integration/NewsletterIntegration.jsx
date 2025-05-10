import IntegrationStyleWrapper from "./Integration.style";
import SectionTitle from "../SectionTitle/SectionTitle";

import driveIcon from "../../assets/images/brands/drive-bg.svg";
import slackIcon from "../../assets/images/brands/slack-bg.svg";
import xeroIcon from "../../assets/images/brands/xero-bg.svg";
import zapierIcon from "../../assets/images/brands/zapier-bg.svg";
import hubspotIcon from "../../assets/images/brands/hubspot-bg.svg";
import chatIcon from "../../assets/images/brands/chat-bg.svg";
import telegramIcon from "../../assets/images/brands/telegram-bg.svg";
import whatsappIcon from "../../assets/images/brands/whatsapp-bg.svg";
import boxIcon from "../../assets/images/brands/box-bg.svg";
import monkeyIcon from "../../assets/images/brands/monkey-bg.svg";
import snapIcon from "../../assets/images/brands/snap-bg.svg";
import zoomIcon from "../../assets/images/brands/zoom-bg.svg";
import ScrollAnimate from "../ScrollAnimate";

const NewsletterIntegration = () => {
  return (
    <IntegrationStyleWrapper className="index2-integration-section newsletter">
      <ScrollAnimate delay={200}>
        <div className="container">
          <div className="index2-integration-content">
            <SectionTitle
              title="Integrate with the tools you already use"
              subtitle="integration"
              alignment="center"
              titleMaxW="520px"
              titleMargin="auto"
            />
            <div className="index2-integration-auto-slider">
              <div className="index2-integration-auto-slider-list scroller">
                <ul className="slid-content">
                  <li className="slid-inner">
                    <img src={driveIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={slackIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={xeroIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={hubspotIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={chatIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={driveIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                </ul>
                <ul className="slid-content">
                  <li className="slid-inner">
                    <img src={chatIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={driveIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={slackIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={xeroIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={hubspotIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={chatIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                </ul>
              </div>
              <div className="index2-integration-auto-slider-list index2-integration-auto-slider-list2 scroller">
                <ul className="slid-content">
                  <li className="slid-inner empty" />
                  <li className="slid-inner">
                    <img src={telegramIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={whatsappIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={boxIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={monkeyIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={snapIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={telegramIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zoomIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                </ul>
                <ul className="slid-content">
                  <li className="slid-inner">
                    <img src={whatsappIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={boxIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={monkeyIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={snapIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={telegramIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zoomIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={zapierIcon} alt="icon" />
                  </li>
                  <li className="slid-inner">
                    <img src={hubspotIcon} alt="icon" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimate>
    </IntegrationStyleWrapper>
  );
};

export default NewsletterIntegration;
