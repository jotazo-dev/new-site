import type { Block } from "./templates";

const wrapTd = (inner: string, padding = "16px 24px") =>
  `<tr><td style="padding:${padding};">${inner}</td></tr>`;

function renderBlock(b: Block): string {
  switch (b.type) {
    case "header": {
      const p = b.props;
      const logo = p.logoUrl ? `<img src="${p.logoUrl}" alt="" style="max-height:48px;display:block;margin:0 auto 12px;" />` : "";
      return `<tr><td style="background:${p.bg};color:${p.color};padding:32px 24px;text-align:center;">${logo}<div style="font-size:24px;font-weight:700;font-family:Arial,sans-serif;">${escapeHtml(p.title)}</div></td></tr>`;
    }
    case "text": {
      const p = b.props;
      return wrapTd(`<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${p.color};text-align:${p.align};">${p.html}</div>`);
    }
    case "image": {
      const p = b.props;
      return wrapTd(`<div style="text-align:${p.align};"><img src="${p.url}" alt="${escapeHtml(p.alt)}" style="max-width:100%;width:${p.width}px;height:auto;display:inline-block;" /></div>`, "8px 24px");
    }
    case "button": {
      const p = b.props;
      return wrapTd(`<div style="text-align:${p.align};"><a href="${p.url}" style="background:${p.bg};color:${p.color};padding:12px 28px;border-radius:8px;font-family:Arial,sans-serif;font-weight:600;text-decoration:none;display:inline-block;">${escapeHtml(p.label)}</a></div>`);
    }
    case "divider":
      return wrapTd(`<hr style="border:0;border-top:1px solid ${b.props.color};margin:0;" />`, "8px 24px");
    case "spacer":
      return `<tr><td style="height:${b.props.height}px;line-height:${b.props.height}px;font-size:0;">&nbsp;</td></tr>`;
    case "columns2": {
      const p = b.props;
      return wrapTd(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="vertical-align:top;padding-right:12px;width:50%;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${p.leftHtml}</td><td style="vertical-align:top;padding-left:12px;width:50%;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${p.rightHtml}</td></tr></table>`);
    }
    case "footer":
      return wrapTd(`<div style="font-family:Arial,sans-serif;font-size:12px;color:${b.props.color};text-align:center;">${escapeHtml(b.props.text)}</div>`, "24px");
  }
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export function renderBlocksToHtml(blocks: Block[]): string {
  const rows = blocks.map(renderBlock).join("");
  return `<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#F1F5F9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
      ${rows}
    </table>
  </td></tr>
</table>
</body></html>`;
}
