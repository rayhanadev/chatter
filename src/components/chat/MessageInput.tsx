import type { PasteEvent } from "@opentui/core";
import { useCallback, useState } from "react";

interface MessageInputProps {
	onSend: (text: string) => void;
	focused?: boolean;
	disabled?: boolean;
}

export function MessageInput({
	onSend,
	focused = true,
	disabled = false,
}: MessageInputProps) {
	const [value, setValue] = useState("");

	const handleSubmit = useCallback(
		(text: string) => {
			if (disabled) return;
			const trimmed = text.trim();
			if (trimmed) {
				onSend(trimmed);
				setValue("");
			}
		},
		[onSend, disabled],
	);

	const handlePaste = useCallback(
		(event: PasteEvent) => {
			if (disabled) return;
			setValue((prev: string) => prev + event.text);
			event.preventDefault();
		},
		[disabled],
	);

	const placeholder = disabled
		? "Chat paused - electing new host..."
		: "Type a message and press Enter...";

	return (
		<box height={3} border title="Message" paddingLeft={1} paddingRight={1}>
			<input
				placeholder={placeholder}
				value={disabled ? "" : value}
				onInput={disabled ? undefined : setValue}
				onSubmit={handleSubmit}
				onPaste={handlePaste}
				focused={focused && !disabled}
				cursorColor={disabled ? "#666666" : "#ff69b4"}
			/>
		</box>
	);
}
