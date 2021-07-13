/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth0 } from "@auth0/auth0-react";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useEffect, useState } from "react";
import { createUser } from "../components/Chat/Apis";
import AlertDialog from "../components/Common/AlertDialog";
import logoImg from "../assets/images/logo.png";
import "./HomePage.css";

const HomePage = (props) => {
	const [loading, setLoading] = useState(false);
	const [popup, setPopup] = useState(false);
	const { isLoading, isAuthenticated, loginWithRedirect, logout, user } =
		useAuth0();

	useEffect(async () => {
		if (!isLoading && isAuthenticated) {
			// create user in the chat when a user is authenticated on the home page
			setLoading(true);
			let userId = await createUser(
				user.email,
				user.given_name,
				user.family_name
			);
			if (!userId) {
				setPopup(true);
			}
			setLoading(false);
		}
	}, [isLoading]);

	const videoCallHandler = () => {
		if (isAuthenticated) {
			props.history.push("/videochat");
		} else {
			loginWithRedirect({
				redirectUri: `${window.location.origin}/videochat`,
			});
		}
	};

	const chatHandler = () => {
		if (isAuthenticated) {
			props.history.push("/chat");
		} else {
			loginWithRedirect({
				redirectUri: `${window.location.origin}/chat`,
			});
		}
	};

	if (popup) {
		return (
			<AlertDialog
				title="ERR Connection Timed Out"
				message="Please check your internet connection and try again."
				showLeft={false}
				showRight={true}
				auto={false}
				btnTextRight="Reload"
				onClose={() => window.location.reload()}
				onRight={() => window.location.reload()}
			/>
		);
	}

	return isLoading || loading ? (
		<center style={{ marginTop: "5px" }}>
			<CircularProgress color="secondary" />
		</center>
	) : (
			<>
				{!isAuthenticated ? (
					<nav id="homepage-nav">
						<button className="btn-roxo" onClick={() => loginWithRedirect()}>
							Log In
            <span
								className="material-icons-outlined"
								style={{ color: "white", fontSize: "30px", margin: "5px" }}
							>
								login
            </span>
						</button>
					</nav>
				) : (
						<nav id="homepage-nav">
							<button className="btn-roxo" onClick={() => logout()}>
								Log Out
            <span
									className="material-icons-outlined"
									style={{ color: "white", fontSize: "30px", margin: "5px" }}
								>
									logout
            </span>
							</button>
							<h3 style={{ fontSize: "30px", float: "right", paddingTop: "10px" }}>
								Hi,{" "}
								{"given_name" in user
									? user.given_name
									: "name" in user
										? user.name
										: user.email}
								!
          </h3>
						</nav>
					)}
				<section id="topo">
					<div id="logo">
						<h2>Konnect Well</h2>
						<img src={logoImg} height="100vh" alt="Logo Meet" />
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
							<div className="botoes">
								<button className="btn-azul" onClick={videoCallHandler}>
									<div>
										Video Call
                  <span
											className="material-icons-outlined"
											style={{ color: "white", fontSize: "50px" }}
										>
											video_call
                  </span>
									</div>
								</button>
								<button className="btn-roxo" onClick={chatHandler}>
									<div>
										<div style={{ marginBottom: "10px" }}>Chat</div>
										<span
											className="material-icons-outlined"
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
				<div className="separador">
					<div className="marcador">01</div>
				</div>
				<section id="conteudo">
					<div className="galeria">
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
					<div className="texto">
						<h1 className="titulo">Built for modern use</h1>
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
				<div className="separador-second">
					<div className="marcador-second">02</div>
				</div>
				<section id="footer">
					<div className="footer-cont">
						<div className="col-1">
							<h2>Experience more together</h2>
						</div>
						<div className="col-2">
							<p>
								Stay connected with reliable HD meetings and unlimited one-on-one
								and group video sessions.
            </p>
						</div>
						<div className="col-3">
							{!isLoading ? (
								<button
									className="btn-roxo-f"
									onClick={() => loginWithRedirect()}
								>
									<div>
										{!isAuthenticated ? "Log In" : "Log Out"}
										<span
											className="material-icons-outlined"
											style={{ color: "white", fontSize: "30px", margin: "5px" }}
										>
											{!isAuthenticated ? "login" : "logout"}
										</span>
									</div>
								</button>
							) : (
									<CircularProgress color="secondary" />
								)}
						</div>
					</div>
				</section>
			</>
		);
};

export default HomePage;
