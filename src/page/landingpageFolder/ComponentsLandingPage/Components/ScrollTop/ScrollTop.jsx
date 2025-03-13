import { useEffect, useRef } from "react";
import ScrollTopStyleWrapper from "./ScrollTop.style";
import { FaArrowUp } from "react-icons/fa6";

const ScrollTop = ({ variant }) => {
  const scrollTopCard = useRef(null);
  const scrollTopPath = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const pathLength = scrollTopPath.current.getTotalLength();
      const offset = 50;

      scrollTopPath.current.style.transition = "none";
      scrollTopPath.current.style.WebkitTransition = "none";
      scrollTopPath.current.style.strokeDasharray =
        pathLength + " " + pathLength;
      scrollTopPath.current.style.strokeDashoffset = pathLength;
      scrollTopPath.current.style.transition = "stroke-dashoffset 10ms linear";
      scrollTopPath.current.style.WebkitTransition =
        "stroke-dashoffset 10ms linear";

      const scroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const progress = pathLength - (scroll * pathLength) / height;
      scrollTopPath.current.style.strokeDashoffset = progress;
      const scrollElementPos =
        document.body.scrollTop || document.documentElement.scrollTop;
      if (scrollElementPos >= offset) {
        scrollTopCard.current.classList.add("progress-done");
      } else {
        scrollTopCard.current.classList.remove("progress-done");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = (e) => {
    e.preventDefault();
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <ScrollTopStyleWrapper
      ref={scrollTopCard}
      className={`${variant}`}
      onClick={handleScrollToTop}
    >
      <svg
        className="progress-circle svg-content"
        width="100%"
        height="100%"
        viewBox="-1 -1 102 102"
      >
        <path
          ref={scrollTopPath}
          d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
        />
      </svg>
      <div className={`staco-scroll-top-icon ${variant}`}>
        <FaArrowUp />
      </div>
    </ScrollTopStyleWrapper>
  );
};

export default ScrollTop;
