import * as Api from "./api.js";

function GeneratePostNode(Post) {
    const Node = document.createElement("div");
    Node.style.order = parseInt(Post.Timestamp);
    Node.innerHTML = `
        ${String(Post.Url).endsWith(".mp4") ? `
            <div class="Player">
                <video src="${Post.Url}"></video>
                <img draggable="false" class="Play" style="" src="../images/Play.svg">
                <img draggable="false" class="Pause" style="display: none" src="../images/Pause.svg">
                <div class="Bar">
                    <div class="Duration">-0</div>
                    <div class="TimeLeft">-0</div>
                    <div class="Fill"></div>
                </div>
            </div>
            ` : ""
        }
        ${String(Post.Url).endsWith(".mp4") ? "" : `<img draggable="false" src="${Post.Url}"></img>`}
        <div>
            <span class="Author">${Post.Author}</span>
            <span class="Caption">${Post.Caption}</span>
        </div>
    `;
    Api.Roll.appendChild(Node);

    const Player = Node.querySelector(".Player");
    if (!Player) return;
    const Video = Player.querySelector("video");
    const Bar = Player.querySelector(".Bar");
    const Fill = Bar.querySelector(".Fill");

    let Dragging = false;
    Bar.addEventListener("mousedown", Event => {
        Dragging = true;
        UpdateCurrentTime(Event.pageX);
    });

    document.addEventListener("mousemove", Event => {
        if (!Dragging) return;
        UpdateCurrentTime(Event.pageX);
    });

    document.addEventListener("mouseup", () => {
        Dragging = false;
    });

    Video.addEventListener("timeupdate", () => {
        Fill.style.width = `${(Video.currentTime / Video.duration) * 100}%`;
        Bar.querySelector(".Duration").innerHTML = Math.floor(Video.currentTime);
        Bar.querySelector(".TimeLeft").innerHTML = Math.floor(Video.duration - Video.currentTime);
    });

    Player.addEventListener("click", () => {
        if (Video.paused) {
            Video.play();

            Player.querySelector(".Play").style.display = "none";
            Player.querySelector(".Pause").style.display = "";
        } else {
            Video.pause();

            Player.querySelector(".Play").style.display = "";
            Player.querySelector(".Pause").style.display = "none";
        }

        setTimeout(() => {
            Player.querySelector(".Play").style.opacity = "0";
            Player.querySelector(".Pause").style.opacity = "0";
        }, 2000);
    });

    Player.addEventListener("mousemove", () => {
        Player.querySelector(".Play").style.opacity = "1";
        Player.querySelector(".Pause").style.opacity = "1";
        Player.style.cursor = "";
        setTimeout(() => {
            Player.querySelector(".Play").style.opacity = "0";
            Player.querySelector(".Pause").style.opacity = "0";
            Player.style.cursor = "none";
        }, 2000);
    });

    function UpdateCurrentTime(PageX) {
        const BarRect = Bar.getBoundingClientRect();
        const OffsetX = PageX - BarRect.left;
        const NewTime = (OffsetX / Bar.offsetWidth) * Video.duration;
        Video.currentTime = Math.max(0, Math.min(Video.duration, NewTime));
    }
}

function FetchPostFromFile(Path = "" || new File) {
    return `https://github.com/kayyraa/DirectStorage/raw/refs/heads/main/roll/${typeof Path === "string" ? Path : Path.name}`;
}

async function FetchPosts() {
    const Storage = new Api.Storage("Roll");
    await Storage.GetDocuments().then((Documents) => {
        Documents.forEach((Document) => {
            GeneratePostNode(Document);
        });
    });
}

FetchPosts();

const UploadInput = document.createElement("input");
UploadInput.type = "file";
UploadInput.accept = "image/*,video/*";

Api.UploadButton.addEventListener("click", () => {
    UploadInput.click();
});

let Post;
UploadInput.addEventListener("change", () => {
    const File = UploadInput.files[0];
    if (!File) return;

    const Reader = new FileReader();
    Reader.onload = async () => {
        const FileName = `${btoa(File.name.split(".")[0]) +
            btoa(File.name.split(".")[0])[Math.floor(Math.random() * File.name.split(".")[0].length)] +
            Math.floor(Math.random() * 9999).toString()}.${File.name.split(".")[1]}`;
        const FilePath = `roll/${FileName}`;
        await new Api.GithubStorage(File).Upload(FilePath);

        Post = {
            Url: FetchPostFromFile(FileName),
        };
        UploadInput.innerHTML = String(File.name);
    };

    Reader.readAsDataURL(File);
});

Api.PublishButton.addEventListener("click", async () => {
    const Caption = Api.CaptionInput.value;
    if (!Caption) return;

    Post = {
        Url: Post.Url,
        Caption: Caption,
        Timestamp: Math.floor(Date.now() / 1000),
        Author: JSON.parse(localStorage.getItem("User")).Username
    };

    await new Api.Storage("Roll").AppendDocument(Post);
    location.reload();
});