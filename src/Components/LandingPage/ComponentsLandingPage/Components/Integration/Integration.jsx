import IntegrationStyleWrapper from "./Integration.style";
import SectionTitle from "../SectionTitle/SectionTitle";
import Drive from "../../assets/images/brands/drive-bg.svg";
import Slack from "../../assets/images/brands/slack-bg.svg";
import Xero from "../../assets/images/brands/xero-bg.svg";
import Zapier from "../../assets/images/brands/zapier-bg.svg";
import Hubspot from "../../assets/images/brands/hubspot-bg.svg";
import Chat from "../../assets/images/brands/chat-bg.svg";
import Telegram from "../../assets/images/brands/telegram-bg.svg";
import Whatsapp from "../../assets/images/brands/whatsapp-bg.svg";
import Box from "../../assets/images/brands/box-bg.svg";
import Monkey from "../../assets/images/brands/monkey-bg.svg";
import Snap from "../../assets/images/brands/snap-bg.svg";
import Zoom from "../../assets/images/brands/zoom-bg.svg";
import BgRactangle from "../../assets/images/bg/bg-ractangle-shape.png";
import ScrollAnimate from "../ScrollAnimate";

const Integration = () => {
  const imageGroups = [
    [Drive, Slack, Xero, Zapier, Hubspot, Chat, Drive, Zapier],
    [Drive, Slack, Xero, Zapier, Hubspot, Chat, Drive, Zapier],
  ];
  const imageGroups2 = [
    ["", Telegram, Whatsapp, Box, Monkey, Snap, Telegram, Zoom, Zapier],
    [Telegram, Whatsapp, Box, Monkey, Snap, Telegram, Zoom, Zapier],
  ];

  return (
    <IntegrationStyleWrapper className="index2-integration-section">
      <span className="index2-integration-bg">
        <img src={BgRactangle} alt="img" />
      </span>
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
                {imageGroups.map((imageGroup, groupIndex) => (
                  <ul key={groupIndex} className="slid-content">
                    {imageGroup.map((image, index) => (
                      <li key={index} className="slid-inner">
                        <img src={image} alt={`icon-${groupIndex}-${index}`} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
              <div className="index2-integration-auto-slider-list index2-integration-auto-slider-list2 scroller">
                {imageGroups2.map((imageGroup, groupIndex) => (
                  <ul key={groupIndex} className="slid-content">
                    {imageGroup.map((image, index) => (
                      <li key={index} className="slid-inner">
                        <img src={image} alt={`icon-${groupIndex}-${index}`} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimate>
    </IntegrationStyleWrapper>
  );
};

export default Integration;
