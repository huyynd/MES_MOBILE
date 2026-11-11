import React from 'react';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

// Logo Ngọc An Thư — vẽ lại đúng file vector của web (D:\Project_MES\public\logo.svg).
//  variant="full": đủ chữ A + vệt cam + "Plastic" + "NGOC AN THU" (khung 250×220)
//  variant="mark": chỉ phần hình (chữ A + vệt cam), dùng cho chỗ nhỏ như thanh tiêu đề
const NAVY = '#1f2a44';
const ORANGE = '#ea6a1f';

export function BrandLogo({ size = 120, variant = 'full', mono }: { size?: number; variant?: 'full' | 'mark'; mono?: string }) {
  const navy = mono || NAVY;
  const orange = mono || ORANGE;
  const full = variant === 'full';
  // mark: cắt khung quanh phần hình (x 26..242, y 4..180)
  const viewBox = full ? '0 0 250 220' : '26 4 216 176';
  const ratio = full ? 220 / 250 : 176 / 216;
  return (
    <Svg width={size} height={size * ratio} viewBox={viewBox} accessibilityLabel="Ngọc An Thư Plastic">
      <Path d="M112 8 L160 92 L144 92 L112 36 L80 92 L64 92 Z" fill={navy} />
      <Path d="M112 44 L138 92 L128 92 L112 62 L96 92 L86 92 Z" fill={navy} />
      <Path d="M30 176 C 30 120, 110 92, 238 98 C 150 104, 66 124, 56 176 Z" fill={orange} />
      <Path d="M150 112 L190 176 L176 176 L146 128 Z" fill={orange} />
      <Path d="M120 150 L182 150 L186 157 L116 157 Z" fill={orange} />
      {full && (
        <>
          <SvgText x={64} y={131} transform="rotate(-9 64 131)" fontFamily="serif" fontStyle="italic" fontWeight="700"
            fontSize={17} letterSpacing={2.5} fill={navy}>Plastic</SvgText>
          <SvgText x={40} y={198} fontFamily="sans-serif" fontSize={25} fontWeight="500" letterSpacing={0.5}
            fill={mono || '#3a3f4a'}>NGOC AN THU</SvgText>
        </>
      )}
    </Svg>
  );
}
