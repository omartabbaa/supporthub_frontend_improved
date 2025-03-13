import styled from "styled-components";

const ScrollTopStyleWrapper = styled.div`
  position: fixed;
  right: 30px;
  bottom: 25px;
  width: 45px;
  height: 45px;
  cursor: pointer;
  display: block;
  border-radius: 100%;
  box-shadow: inset 0 0 0 0.1rem rgba(128, 130, 134, 0.25);
  z-index: 9999999;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0.75rem);
  transition: all 0.2s linear, margin-right 0s;

  &.progress-done {
    visibility: visible;
    transform: translateY(0);
  }

  .staco-scroll-top-icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.primary}cc;
    &.v6 {
      color: ${({ theme }) => theme.colors.v6templateColor}cc;
    }
    &.defi {
      color: ${({ theme }) => theme.colors.v8Title}cc;
    }
    &.chatbot {
      color: ${({ theme }) => theme.colors.chatbotPrimary};
    }
    &.crypto {
      color: #01ffb0;
    }
    &.crypto2 {
      color: #4541fe;
    }
    &.corporate {
      color: #5ecc62;
    }
    &.crypto-token {
      color: #bfff0a;
    }
    &.nft {
      color: #5f5fff;
    }
    &.sass {
      color: #0555ff;
    }
  }

  > svg path {
    fill: none;
  }

  > svg.progress-circle path {
    stroke: ${({ theme }) => theme.colors.primary}cc;
    stroke-width: 4;
    box-sizing: border-box;
    transition: all 200ms linear;
  }

  &.v6 {
    > svg.progress-circle path {
      stroke: ${({ theme }) => theme.colors.v6templateColor}cc;
    }
  }
  &.defi {
    > svg.progress-circle path {
      stroke: ${({ theme }) => theme.colors.v8Title}cc;
    }
  }
  &.chatbot {
    > svg.progress-circle path {
      stroke: ${({ theme }) => theme.colors.chatbotPrimary}cc;
    }
  }
  &.crypto {
    > svg.progress-circle path {
      stroke: #01ffb0;
    }
  }
  &.crypto2 {
    > svg.progress-circle path {
      stroke: #4541fe;
    }
  }
  &.corporate {
    > svg.progress-circle path {
      stroke: #5ecc62;
    }
  }
  &.crypto-token {
    > svg.progress-circle path {
      stroke: #bfff0a;
    }
  }
  &.nft {
    > svg.progress-circle path {
      stroke: #5f5fff;
    }
  }
  &.sass {
    > svg.progress-circle path {
      stroke: #0555ff;
    }
  }

  @media (min-width: 1px) {
    &.progress-done {
      opacity: 1;
    }
  }
`;

export default ScrollTopStyleWrapper;
