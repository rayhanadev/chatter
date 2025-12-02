import type { PasteEvent } from "@opentui/core";
import { useCallback, useState } from "react";

interface MessageInputProps {
	onSend: (text: string) => void;
	focused?: boolean;
}

export function MessageInput({ onSend, focused = true }: MessageInputProps) {
	const [value, setValue] = useState("");

	const handleSubmit = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (trimmed) {
				onSend(trimmed);
				setValue("");
			}
		},
		[onSend],
	);

	const handlePaste = useCallback((event: PasteEvent) => {
		setValue((prev: string) => prev + event.text);
		event.preventDefault();
	}, []);

	return (
		<box height={3} border title="Message" paddingLeft={1} paddingRight={1}>
			<input
				placeholder="Type a message and press Enter..."
				value={value}
				onInput={setValue}
				onSubmit={handleSubmit}
				onPaste={handlePaste}
				focused={focused}
				cursorColor="#ff69b4"
			/>
		</box>
	);
}
