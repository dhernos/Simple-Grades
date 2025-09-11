// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}