import styled from "styled-components";

const FooterContractStyle = styled.div`
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.03) 100%);
    padding: 15px 30px;
    margin-top: -25px;
    margin-bottom: 30px;
    ul{
        padding: 0px;
        margin: 0;
        li{
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 15px;
            padding: 7.5px 0px;
            a{
                color: ${({ theme }) => theme.colors.whiteColor};
                font-weight: 700;
            }
        }
    }

    @media screen and (max-width: 767px){
        margin-top: 0;
    }
`;

export default FooterContractStyle;
