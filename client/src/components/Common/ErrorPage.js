import AlertDialog from "./AlertDialog";

const ErrorPage = () => {
  return (
    <AlertDialog
      title="404 - Not Found!"
      message="This page doesn't exists. You will shortly be redirected to the application's home page."
      showLeft={false}
      showRight={true}
      btnTextRight={"Ok"}
      auto={true}
      time={5000}
      onClose={() => {
        window.location.href = window.location.origin;
      }}
      onRight={() => {
        window.location.href = window.location.origin;
      }}
    />
  );
};

export default ErrorPage;
