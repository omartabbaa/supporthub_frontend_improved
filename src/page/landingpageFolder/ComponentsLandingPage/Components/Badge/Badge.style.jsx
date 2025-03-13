import styled from "styled-components";

const BadgeStyleWrapper = styled.section`
    .chatbot-testmonial-badge{
        max-width: 620px;
        width: 100%;
        margin: auto;
        padding-top: 80px;
        ul{
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1%;
            padding: 0px;
            list-style: none;
            li{
                width: 19%;
            }
        }
    }

    @media screen and (max-width: 767px){
        .chatbot-testmonial-badge {
            padding-top: 50px;
        }
    }
`; 

export default BadgeStyleWrapper;
