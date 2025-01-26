import * as Api from "./api.js";

export function FetchFileFromFile(Path = "" || new File) {
    return `https://github.com/kayyraa/DirectStorage/raw/refs/heads/main/roll/${typeof Path === "string" ? Path : Path.name}`;
}

let Time = 0;
async function FetchPosts(Filter = { Author: "", Caption: "", Tags: [] }) {
    Api.Roll.querySelectorAll("[post]").forEach(Post => Post.remove());

    const Storage = new Api.Storage("Roll");
    const Documents = await Storage.GetDocuments();

    Documents.forEach(async (Post) => {
        let MatchesFilter = true;

        Api.FilterLabel.innerHTML = "Filter: None"
        if (Filter) {
            Object.keys(Filter).forEach(Key => {
                if (!Filter[Key] || (Array.isArray(Filter[Key]) && Filter[Key].length === 0)) return;
            
                Api.FilterLabel.innerHTML = `Filter: ${Key}: "${Filter[Key]}"`;
            
                if (Key === "Tags") {
                    if (!Post[Key]?.some(Tag => Filter[Key].includes(Tag))) {
                        MatchesFilter = false;
                    }
                } else if (!Post[Key]?.includes(Filter[Key])) {
                    MatchesFilter = false;
                }
            });
        }
        if (!MatchesFilter) return;

        if (Api.Roll.querySelector("img[spinner]")) Api.Roll.querySelector("img[spinner]").remove();

        Time += parseInt(Post.Timestamp);
        const AuthorDocument = await new Api.Storage("Users").GetDocumentsByField("Username", Post.Author);

        const Node = document.createElement("div");
        Node.style.order = -Post.Timestamp;
        Node.setAttribute("post", "true");
        Node.innerHTML = `
            <div class="Author">
                <img src="${AuthorDocument && AuthorDocument[0]?.ProfileImage || "../images/DefaultUser.svg"}">
                <span class="AuthorLabel">${Post.Author}</span>
                <span>•</span>
                <span class="Timestamp">${Api.FormatTime(Post.Timestamp, "hh and mm ago &now:mm:15")}</span>
            </div>
            <div class="Loader"></div>
            ${String(Post.Url).endsWith(".mp4") ? `
                <div class="Player">
                    <video class="Media" src="${Post.Url}"></video>
                    <img draggable="false" class="Play" src="../images/Play.svg">
                    <img draggable="false" class="Pause" style="display: none" src="../images/Pause.svg">
                    <div class="Bar">
                        <div class="Duration">-0</div>
                        <div class="TimeLeft">-0</div>
                        <div class="Fill"></div>
                    </div>
                </div>
            ` : `<img draggable="false" class="Media" src="${Post.Url}"></img>`}
            <div>
                <span class="Caption">${String(Post.Caption).length > 32 ? `${String(Post.Caption).slice(0, 32)}...` : String(Post.Caption)}</span>
                <span>•</span>
                <img draggable="false" button class="LikeButton" src="../images/Like.svg">
                <span class="LikeCount">0</span>
                <img draggable="false" src="../images/Views.svg">
                <span class="ViewCount">0</span>
                ${Post.Author === JSON.parse(localStorage.getItem("User")).Username ? "<button color false class='RemoveButton'>Remove</button>" : ""}
                <div class="Tags"></div>
            </div>
        `;

        Api.Roll.appendChild(Node);
        Post.Tags?.forEach(Tag => Node.querySelector(".Tags").appendChild(Object.assign(document.createElement("span"), { textContent: Tag })));
        Array.from(Node.querySelector(".Tags").children).forEach(Tag => {
            Tag.addEventListener("click", () => FetchPosts({ Tags: [String(Tag.innerHTML)] }));
        });

        Node.querySelector(".Media").onload = () => Node.querySelector(".Loader").remove();

        Node.querySelector(".Caption").addEventListener("click", () => {
            const FullCaption = String(Post.Caption);
            const ShortenedCaption = `${FullCaption.slice(0, 32)}...`;
            const CurrentCaption = Node.querySelector(".Caption").innerHTML;

            if (CurrentCaption === ShortenedCaption) Node.querySelector(".Caption").innerHTML = FullCaption;
            if (CurrentCaption === FullCaption) Node.querySelector(".Caption").innerHTML = ShortenedCaption;
        });

        const RemoveButton = Node.querySelector(".RemoveButton");
        if (RemoveButton) {
            RemoveButton.addEventListener("click", async () => {
                await new Api.Storage("Roll").DeleteDocument(Post.id);
                Node.remove();
            });
        }

        let Views = Post.Views || 0;
        let Likes = Array.isArray(Post.Likes) ? Post.Likes : [];
        const User = JSON.parse(localStorage.getItem("User")) || {};
        const Username = User.Username || "";

        const ViewsCountLabel = Node.querySelector(".ViewCount");
        ViewsCountLabel.innerHTML = Views;

        Node.querySelector(".Media").addEventListener("click", async () => {
            Views++;
            await new Api.Storage("Roll").UpdateDocument(Post.id, { Views: Views });
        });

        let Liked = Likes.includes(Username);
        const LikeButton = Node.querySelector(".LikeButton");
        const LikeCount = Node.querySelector(".LikeCount");
        LikeCount.innerHTML = Likes.length;
        LikeButton.src = Liked ? "../images/Liked.svg" : "../images/Like.svg";

        LikeButton.addEventListener("mouseenter", () => {
            LikeButton.src = Liked ? "../images/Like.svg" : "../images/Liked.svg";
        });
        LikeButton.addEventListener("mouseleave", () => {
            LikeButton.src = Liked ? "../images/Liked.svg" : "../images/Like.svg";
        });
        LikeButton.addEventListener("click", async () => {
            if (Liked) {
                Liked = false;
                Likes = Likes.filter(User => User !== Username);
                await new Api.Storage("Roll").UpdateDocument(Post.id, { Likes });
                LikeButton.src = "../images/Like.svg";
                LikeCount.innerHTML = Likes.length;
            } else {
                Liked = true;
                Likes = [...Likes, Username];
                await new Api.Storage("Roll").UpdateDocument(Post.id, { Likes });
                LikeButton.src = "../images/Liked.svg";
                LikeCount.innerHTML = Likes.length;
            }
        });
    });
}

await FetchPosts();

Api.Roll.querySelector(".Filter").querySelector(".ClearFilterButton").addEventListener("click", () => FetchPosts(undefined));

const UploadInput = document.createElement("input");
UploadInput.type = "file";
UploadInput.accept = "image/*,video/*";

Api.UploadButton.addEventListener("click", () => {
    UploadInput.click();
    Api.UploadButton.innerHTML = "Waiting for input...";
});

let Post;
UploadInput.addEventListener("change", () => {
    const File = UploadInput.files[0];
    if (!File) return;

    Api.UploadButton.innerHTML = "Uploading...";

    const Reader = new FileReader();
    Reader.onload = async () => {
        const FileName = `${btoa(File.name.split(".")[0]) +
            btoa(File.name.split(".")[0])[Math.floor(Math.random() * File.name.split(".")[0].length)] +
            Math.floor(Math.random() * 9999).toString()}.${File.name.split(".")[1]}`;
        const FilePath = `roll/${FileName}`;
        await new Api.GithubStorage(File).Upload(FilePath);

        Post = {
            Url: FetchFileFromFile(FileName),
        };

        Api.UploadButton.innerHTML = String(File.name);
    };

    Reader.readAsDataURL(File);
});

Api.PublishButton.addEventListener("click", async () => {
    const Caption = Api.CaptionInput.value;
    if (!Caption) return;

    const Tags = Api.TagInput.value.split(",");

    Post = {
        Url: Post.Url,
        Caption: Caption,
        Timestamp: Math.floor(Date.now() / 1000),
        Author: JSON.parse(localStorage.getItem("User")).Username,
        Tags: Tags
    };

    await new Api.Storage("Roll").AppendDocument(Post);
    location.reload();
});

Api.Roll.querySelectorAll("div[class]").forEach((Node, Index) => Node.style.order = -Time - Index);