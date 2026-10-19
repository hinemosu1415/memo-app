import { useEffect, useState, type SubmitEvent } from "react";

type Memo = {
	id: number;
	text: string;
};

export function useMemos() {
	const [memos, setMemos] = useState<Memo[]>([]);
	const [text, setText] = useState("");

	useEffect(() => {
		async function loadMemos() {
			try {
				const response = await fetch("/api/memos");
				if (!response.ok) throw new Error("メモを読み込めませんでした");

				setMemos((await response.json()) as Memo[]);
			} catch (cause) {
				console.error(cause);
			}
		}

		void loadMemos();
	}, []);

	async function addMemo(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!text.trim()) return;

		try {
			const response = await fetch("/api/memos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			if (!response.ok) throw new Error("メモを追加できませんでした");

			setText("");
			const listResponse = await fetch("/api/memos");
			if (!listResponse.ok) throw new Error("メモを読み込めませんでした");
			setMemos((await listResponse.json()) as Memo[]);
		} catch (cause) {
			console.error(cause);
		}
	}

	async function removeMemo(id: number) {
		try {
			const response = await fetch(`/api/memos/${id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("メモを削除できませんでした");

			const listResponse = await fetch("/api/memos");
			if (!listResponse.ok) throw new Error("メモを読み込めませんでした");
			setMemos((await listResponse.json()) as Memo[]);
		} catch (cause) {
			console.error(cause);
		}
	}

	return {
		memos,
		text,
		setText,
		addMemo,
		removeMemo,
	};
}
