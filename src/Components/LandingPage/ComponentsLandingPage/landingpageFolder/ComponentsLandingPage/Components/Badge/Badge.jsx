import BadgeStyleWrapper from "./Badge.style";

import BadgeImg1 from "../../assets/images/chatbot/badge_1.svg";
import BadgeImg2 from "../../assets/images/chatbot/badge_2.svg";
import BadgeImg3 from "../../assets/images/chatbot/badge_3.svg";
import BadgeImg4 from "../../assets/images/chatbot/badge_4.svg";
import BadgeImg5 from "../../assets/images/chatbot/badge_5.svg";
import ScrollAnimate from "../ScrollAnimate";

const Badge = ({ parentClass }) => {
  // Badge data array
  const badgeData = [BadgeImg1, BadgeImg2, BadgeImg3, BadgeImg4, BadgeImg5];

  return (
    <BadgeStyleWrapper>
      <div className={parentClass}>
        <ScrollAnimate delay={200}>
          <ul>
            {badgeData.map((badge, index) => (
              <li key={index}>
                <img src={badge} alt={`badge_${index + 1}`} />
              </li>
            ))}
          </ul>
        </ScrollAnimate>
      </div>
    </BadgeStyleWrapper>
  );
};

export default Badge;
