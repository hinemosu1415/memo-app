import { createRoot } from "react-dom/client";
import { useMemos } from "./use-memos";
import "./style.css";

function App() {
	const {
		memos,
		text,
		setText,
		addMemo,
		removeMemo,
	} = useMemos();

	return (
		<main className="container">
			<p className="eyebrow">React + Hono + SQLite</p>
			<h1>メモ帳</h1>
			<p className="description">追加したメモはSQLiteに保存されます。</p>

			<form onSubmit={addMemo} className="add-form">
				<input
					aria-label="新しいメモ"
					value={text}
					onChange={(event) => setText(event.target.value)}
					maxLength={200}
					placeholder="メモを入力"
				/>
				<button type="submit">追加</button>
			</form>

			{memos.length === 0 ? (
				<p>まだメモはありません。</p>
			) : (
				<ul className="memo-list">
					{memos.map((memo) => (
						<li key={memo.id}>
							<span>{memo.text}</span>
							<button
								type="button"
								className="delete"
								onClick={() => removeMemo(memo.id)}
								aria-label={`${memo.text}を削除`}
							>
								削除
							</button>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}

createRoot(document.getElementById("root")!).render(<App />);
