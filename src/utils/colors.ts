const NICKNAME_COLORS = [
	"#ff1493", // deep pink
	"#ba55d3", // medium orchid
	"#9370db", // medium purple
	"#6495ed", // cornflower blue
	"#00bfff", // deep sky blue
	"#40e0d0", // turquoise
	"#00fa9a", // medium spring green
	"#98fb98", // pale green
	"#f0e68c", // khaki
	"#ffa07a", // light salmon
	"#ff7f50", // coral
	"#ff6347", // tomato
	"#dda0dd", // plum
];

export function nicknameToColor(nickname: string): string {
	let hash = 0;
	for (let i = 0; i < nickname.length; i++) {
		hash = ((hash << 5) - hash + nickname.charCodeAt(i)) | 0;
	}

	return NICKNAME_COLORS[Math.abs(hash) % NICKNAME_COLORS.length]!;
}
