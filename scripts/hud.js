import * as Api from "./api.js";
import * as Roll from "./roll.js";

const Storage = new Api.Storage("Users");
const User = await Storage.GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username);

Api.UsernameLabel.innerHTML = User[0].Username;
Api.ProfileImage.src = User[0].ProfileImage || "../images/DefaultUser.svg";

const ProfileImageInput = document.createElement("input");
ProfileImageInput.type = "file";
ProfileImageInput.accept = "image/*";

Api.ProfileImageUploadButton.addEventListener("click", () => ProfileImageInput.click());

ProfileImageInput.addEventListener("change", () => {
    const File = ProfileImageInput.files[0];
    if (File) {
        const Reader = new FileReader();
        Reader.onload = async () => {
            const FileName = `${btoa(File.name.split(".")[0]) +
                btoa(File.name.split(".")[0])[Math.floor(Math.random() * File.name.split(".")[0].length)] +
                Math.floor(Math.random() * 9999)}.${File.name.split(".")[1]}`;

            await new Api.GithubStorage(File).Upload(`roll/${FileName}`);
            Api.ProfileImageUploadButton.innerHTML = File.name;

            Api.ProfileImageApplyButton.addEventListener("click", async () => {
                const ProfileImage = Roll.FetchFileFromFile(FileName);
                await new Api.Storage("Users").UpdateDocument(User[0].id, { ProfileImage });
                Api.ProfileImage.src = ProfileImage;
            }, { once: true });
        };
        Reader.readAsDataURL(File);
    }
});