import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export const FirebaseConfig = {
    apiKey: "AIzaSyDonff5W0PGgJvw11gFeTukEGYr-_hQTZU",
    authDomain: "shortflash-18461.firebaseapp.com",
    projectId: "shortflash-18461",
    storageBucket: "shortflash-18461.firebasestorage.app",
    messagingSenderId: "446649134250",
    appId: "1:446649134250:web:f9bb44037802a369eb34d3",
    measurementId: "G-WH1XXRWTZK"
};

export const GithubStorageConfig = {
    Token: "",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

export const Roll = document.querySelector(".Roll");
export const Profile = document.querySelector(".Profile");
export const Publish = document.querySelector(".Publish");
export const Popup = document.querySelector(".Popup");

export const UploadButton = document.querySelector(".UploadButton");
export const PublishButton = document.querySelector(".PublishButton");
export const CaptionInput = document.querySelector(".CaptionInput");
export const TagInput = document.querySelector(".TagInput");

export const LogOutButton = document.querySelector(".LogOutButton");
export const DeleteAccountButton = document.querySelector(".DeleteAccountButton");

export const ProfileImageUploadButton = document.querySelector(".ProfileImageUploadButton");
export const ProfileImageApplyButton = document.querySelector(".ProfileImageApplyButton");
export const ProfileImage = document.querySelector(".ProfileImage");
export const UsernameLabel = document.querySelector(".UsernameLabel");

export class GithubStorage {
	constructor(Document) {
		this.File = Document || null;
	}

	async Upload(Path = "") {
		if (!this.File) throw new Error("No file provided for upload.");
		const FileContent = await this.ReadFileAsBase64(this.File);

		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
		const Data = {
			message: "Upload file to repo",
			content: FileContent
		};

		const Response = await fetch(Url, {
			method: "PUT",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			},
			body: JSON.stringify(Data)
		});

		const Result = await Response.json();
		if (Response.ok) {
			console.log("File uploaded:", Result.content.html_url);
		} else {
			console.error("Upload failed:", Result);
		}
	}

	async Download(Path) {
		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;

		const Response = await fetch(Url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			}
		});

		if (Response.ok) {
			const Result = await Response.json();
			const FileContent = atob(Result.content); // Decode Base64 content
			const Blob = new Blob([FileContent], { type: "application/octet-stream" });
			return new File([Blob], Path.split("/").pop(), { type: Blob.type });
		} else {
			const ErrorData = await Response.json();
			console.error("Failed to fetch file:", ErrorData);
			throw new Error(ErrorData.message || "File fetch failed");
		}
	}

	async ReadFileAsBase64(File) {
		return new Promise((Resolve, Reject) => {
			const Reader = new FileReader();
			Reader.onload = () => Resolve(Reader.result.split(",")[1]);
			Reader.onerror = Reject;
			Reader.readAsDataURL(File);
		});
	}
}

export class Storage {
    constructor(Collection = "") {
        this.Collection = Collection;
    }

    async AppendDocument(DocumentData) {
        if (!this.Collection) return;
        const DocRef = await Firestore.addDoc(Firestore.collection(Db, this.Collection), DocumentData);
        return DocRef.id;
    }

    async GetDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        const Snapshot = await Firestore.getDoc(DocRef);
    
        if (Snapshot.exists()) {
            const data = Snapshot.data();
            return [{ id: Snapshot.id, ...data }];
        } else return null;
    }

    async UpdateDocument(DocumentId, DocumentData) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.updateDoc(DocRef, DocumentData);
    }

    async DeleteDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.deleteDoc(DocRef);
    }

    async GetDocuments(Query = {}) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        let QueryRef = CollectionRef;
        Object.entries(Query).forEach(([Key, Value]) => {
            QueryRef = Firestore.query(QueryRef, Firestore.where(Key, "==", Value));
        });
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentsByField(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, "==", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentByFieldIncludes(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, ">=", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    OnSnapshot(Callback) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        Firestore.onSnapshot(CollectionRef, (Snapshot) => {
            Callback(Snapshot.docs);
        });
    }
}



GithubStorageConfig.Token = await new Storage("Secrets").GetDocument("Token").then((Document) => Document[0].Value);

export function FormatTime(EpochTime = 0, Pattern = "") {
    const NewDate = new Date(EpochTime * 1000);
    const CurrentDate = new Date();

    const Hours = String(NewDate.getHours()).padStart(2, "0");
    const Minutes = String(NewDate.getMinutes()).padStart(2, "0");
    const Day = String(NewDate.getDate()).padStart(2, "0");
    const Month = String(NewDate.getMonth() + 1).padStart(2, "0");
    const Year = NewDate.getFullYear();

    const TimeDifference = CurrentDate - NewDate;
    const SecondsAgo = Math.floor(TimeDifference / 1000);
    const MinutesAgo = Math.floor(TimeDifference / (1000 * 60));
    const HoursAgo = Math.floor(TimeDifference / (1000 * 60 * 60));
    const DaysAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24));
    const MonthsAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24 * 30));
    const YearsAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24 * 30 * 365));
    
    const Selectors = {
        "ss": SecondsAgo,
        "mm": MinutesAgo,
        "hh": HoursAgo,
        "dd": DaysAgo,
        "mo": MonthsAgo,
        "yy": YearsAgo
    }

    if (Pattern.split(" ").find(Now => Now.startsWith("&now")) &&
    Selectors[Pattern.split(" ").find(Now => Now.startsWith("&now")).split(":")[1]] <= parseInt(Pattern.split(" ").find(Now => Now.startsWith("&now")).split(":")[2])) return "now";

    if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24) return `${DaysAgo} day${DaysAgo > 1 ? "s" : ""} ago`;
    if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24 * 30) return `${MonthsAgo} months${MonthsAgo > 1 ? "s" : ""} ago`;
    if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24 * 30 * 12) return `${YearsAgo} year${YearsAgo > 1 ? "s" : ""} ago`;

    const Patterns = {
        "hh:mm:ss dd.mm.yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Day}.${Month}.${Year}`,
        "hh:mm:ss dd/mm/yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Day}/${Month}/${Year}`,
        "hh:mm:ss mm.yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Month}.${Year}`,
        "hh:mm:ss mm/yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Month}/${Year}`,
        "hh:mm:ss": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")}`,
        "hh:mm dd.mm.yyyy": `${Hours}:${Minutes} ${Day}.${Month}.${Year}`,
        "hh:mm dd/mm/yyyy": `${Hours}:${Minutes} ${Day}/${Month}/${Year}`,
        "hh:mm mm.yyyy": `${Hours}:${Minutes} ${Month}.${Year}`,
        "hh:mm mm/yyyy": `${Hours}:${Minutes} ${Month}/${Year}`,
        "hh:mm yyyy": `${Hours}:${Minutes} ${Year}`,
        "hh:mm": `${Hours}:${Minutes}`,
        "dd.mm.yyyy": `${Day}.${Month}.${Year}`,
        "dd/mm/yyyy": `${Day}/${Month}/${Year}`,
        "mm.yyyy": `${Month}.${Year}`,
        "mm/yyyy": `${Month}/${Year}`,
        "yyyy": `${Year}`,
        "mm ago": `${MinutesAgo} minutes ago`,
        "hh ago": `${HoursAgo} hours ago`,
        "dd ago": `${DaysAgo} days ago`,
        "hh and mm ago": `${HoursAgo} hours and ${MinutesAgo % 60} minutes ago`,
        "hh and mm and yyyy ago": `${HoursAgo} hours, ${MinutesAgo % 60} minutes, and ${Year} years ago`,
        "dd hh and mm and yyyy ago": `${DaysAgo} days, ${HoursAgo % 24} hours, ${MinutesAgo % 60} minutes, and ${Year} years ago`,
    };

    return Patterns[Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim()] || "";
}

export function FormatActualTime(Seconds) {
    const Hours = Math.floor(Seconds / 3600);
    const Minutes = Math.floor((Seconds % 3600) / 60);
    const RemainingSeconds = Math.floor(Seconds % 60);

    return Hours > 0
        ? `${String(Hours).padStart(2, "0")}:${String(Minutes).padStart(2, "0")}`
        : `${String(Minutes).padStart(2, "0")}:${String(RemainingSeconds).padStart(2, "0")}`;
}