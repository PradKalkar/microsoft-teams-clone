import { useAuth0 } from "@auth0/auth0-react";
import CircularProgress from '@material-ui/core/CircularProgress';
import "./HomePage.css";

const HomePage = (props) => {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, user } =
    useAuth0();

  const videoCallHandler = () => {
    if (isAuthenticated) {
      props.history.push("/videochat");
    } else {
      loginWithRedirect({
        redirectUri: `${window.location.origin}/videochat`,
      });
    }
  };

  const chatHandler = () => {};

  return (
      isLoading ? (
        <center style={{marginTop: "5px"}}>
          <CircularProgress color="secondary" />
        </center>
      ) :
      (
        <>
        {!isAuthenticated ? (
          <nav id="homepage-nav">
            <button class="btn-roxo" onClick={() => loginWithRedirect()}>
              Log In
              <span
                class="material-icons-outlined"
                style={{ color: "white", fontSize: "30px", margin: "5px" }}
              >
                login
              </span>
            </button>
          </nav>
        ) : (
          <nav id="homepage-nav">
            <button class="btn-roxo" onClick={() => logout()}>
              Log Out
              <span
                class="material-icons-outlined"
                style={{ color: "white", fontSize: "30px", margin: "5px" }}
              >
                logout
              </span>
            </button>
            <h3 style={{ fontSize: "30px", float: "right", paddingTop: "10px" }}>
              Hi, {"name" in user ? user.name : user.email}!
            </h3>
          </nav>
        )
      }
      <section id="topo">
        <div id="logo">
          <h2>Konnect Well</h2>
          <img
            src="/images/logo.png"
            height="100vh"
            alt="Logo Meet"
          />
        </div>
        <div id="banner">
          <div id="banner-01"></div>
          <div id="banner-02">
            <h1>
              Group Chat <br />
              for Everyone
            </h1>
            <p>
              <b>Konnect Well</b> makes it easy to connect with others
              face-to-face virtually and collaborate across any device.
            </p>
            <div class="botoes">
              <button class="btn-azul" onClick={videoCallHandler}>
                <div>
                  Video Call
                  <span
                    class="material-icons-outlined"
                    style={{ color: "white", fontSize: "50px" }}
                  >
                    video_call
                  </span>
                </div>
              </button>
              <button class="btn-roxo" onClick={chatHandler}>
                <div>
                  <div style={{ marginBottom: "10px" }}>Chat</div>
                  <span
                    class="material-icons-outlined"
                    style={{ color: "white", fontSize: "30px" }}
                  >
                    forum
                  </span>
                </div>
              </button>
            </div>
          </div>
          <div id="banner-03"></div>
        </div>
      </section>
      <div class="separador">
        <div class="marcador">01</div>
      </div>
      <section id="conteudo">
        <div class="galeria">
          <div>
            <img
              src="https://msantosdev.com/portfolio/meet/assets/imgs/desk-image-woman-in-videocall.jpg"
              alt="Woman in video call"
            />
          </div>
          <div>
            <img
              src="https://msantosdev.com/portfolio/meet/assets/imgs/desk-image-women-videochatting.jpg"
              alt="Women video chatting"
            />
          </div>
          <div>
            <img
              src="https://msantosdev.com/portfolio/meet/assets/imgs/desk-image-men-in-meeting.jpg"
              alt="Men in meeting"
            />
          </div>
          <div>
            <img
              src="https://msantosdev.com/portfolio/meet/assets/imgs/desk-image-man-texting.jpg"
              alt="Man texting"
            />
          </div>
        </div>
        <div class="texto">
          <h1 class="titulo">Built for modern use</h1>
          <h2> Smarter meetings, chat, all in one place</h2>
          <p>
            Smooth Video calls with screen sharing, live chat in meetings
            <br />
            Chat with any individual, make groups, share files
            <br />
            All in one workspace
          </p>
        </div>
      </section>
      <div class="separador-second">
        <div class="marcador-second">02</div>
      </div>
      <section id="footer">
        <div class="footer-cont">
          <div class="col-1">
            <h2>Experience more together</h2>
          </div>
          <div class="col-2">
            <p>
              Stay connected with reliable HD meetings and unlimited one-on-one
              and group video sessions.
            </p>
          </div>
          <div class="col-3">
            {
            !isLoading ?
            (
            <button class="btn-roxo-f" onClick={() => loginWithRedirect()}>
              <div>
                {!isAuthenticated ? "Log In" : "Log Out"}
                <span
                  class="material-icons-outlined"
                  style={{ color: "white", fontSize: "30px", margin: "5px" }}
                >
                  {!isAuthenticated ? "login" : "logout"}
                </span>
              </div>
            </button>)
            :
            (
              <CircularProgress color="secondary" />
            )
            }   
          </div>
        </div>
      </section>
    </>
    )
  )
};

export default HomePage;