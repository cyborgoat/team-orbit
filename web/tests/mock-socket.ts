import type { Page } from '@playwright/test'
export async function mockSocket(page: Page) {
  await page.routeWebSocket(/\/socket\.io\//, (socket) => {
    socket.send(
      '0' +
        JSON.stringify({
          sid: 'mock-engine',
          upgrades: [],
          pingInterval: 25000,
          pingTimeout: 20000,
          maxPayload: 1000000,
        }),
    )
    socket.onMessage((message) => {
      if (message.toString().startsWith('40'))
        socket.send('40' + JSON.stringify({ sid: 'mock-socket' }))
    })
  })
}
