import * as Api from "./api.js";

const Storage = new Api.Storage("Users");
if (!localStorage.getItem("User")) {
    document.body.querySelectorAll("*:not(.Popup):not(.Popup *)").forEach((Node) => Node.style.filter = "blur(2px)");
    Api.Popup.style.display = "";

    Api.Popup.querySelector(".SubmitButton").addEventListener("click", async () => {
        const Username = Api.Popup.querySelector(".UsernameInput").value;
        const Password = Api.Popup.querySelector(".PasswordInput").value;
        if (!Username || !Password) return;
        const User = { Username: Username, Password: Password, ProfileImage: "" };
        const FoundUser = await Storage.GetDocumentsByField("Username", Username);
        if (FoundUser) {
            if (FoundUser[0].Password === Password) {
                localStorage.setItem("User", JSON.stringify(User));
                location.reload();
            }
        } else {
            await Storage.AppendDocument(User);
            localStorage.setItem("User", JSON.stringify(User));
            location.reload();
        }
    });
} else {
    if (!await Storage.GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username)) {
        localStorage.removeItem("User");
        location.reload();
    }
}