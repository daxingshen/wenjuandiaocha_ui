/**
 * 设备框:手机 / 桌面两态容器,内屏 children(可交互作答)不随设备变。
 * 桌面态带浏览器地址栏壳;尺寸由 .pv-frame.phone/.desktop 决定(components.css)。
 */
import type { ReactNode } from 'react';

export type Device = 'phone' | 'desktop';

export function DeviceFrame({ device, url, children }: { device: Device; url: string; children: ReactNode }) {
  return (
    <div className={`pv-frame ${device}`}>
      {device === 'desktop' && (
        <div className="pv-browserbar">
          <span className="dot3" />
          <span className="dot3" />
          <span className="dot3" />
          <span className="url">{url}</span>
        </div>
      )}
      <div className="pv-scr">{children}</div>
    </div>
  );
}
