import StartBuildingStyleWrapper from "./StartBuilding.style";
import BuildingImg from "../../assets/images/about-us/building-img.svg";
import ScrollAnimate from "../ScrollAnimate";

const StartBuildingComponent = () => {
  return (
    <StartBuildingStyleWrapper>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 col-md-8">
            <div className="building-content">
              <ScrollAnimate delay={200}>
                <div className="section-title">
                  <h2 className="title">
                    Start building a<br />
                    high-performing Website
                  </h2>
                </div>
              </ScrollAnimate>
              <ScrollAnimate delay={200}>
                <a href="/sign-up" className="bg-blue-btn">
                  <span className="btn-inner">
                    <span className="btn-normal-text">Get Start for Free</span>
                    <span className="btn-hover-text">Get Start for Free</span>
                  </span>
                </a>
              </ScrollAnimate>
            </div>
          </div>
          <div className="col-lg-5 col-md-4">
            <ScrollAnimate delay={200}>
            <div className="building-img">
              <img src={BuildingImg} alt="building-img" />
            </div>
            </ScrollAnimate>
          </div>
        </div>
      </div>
    </StartBuildingStyleWrapper>
  );
};

export default StartBuildingComponent;
