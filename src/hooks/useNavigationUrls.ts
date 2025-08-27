import { NavigationService, NavigationOptions } from '@/services/navigation'

export function useNavigationUrls(options: NavigationOptions) {
  const generateAllUrls = () => {
    return NavigationService.generateAllNavigationUrls(options)
  }

  const openInApp = (app: keyof ReturnType<typeof NavigationService.generateAllNavigationUrls>) => {
    const urls = generateAllUrls()
    const url = urls[app]
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const openDefault = () => {
    const defaultApp = NavigationService.getDefaultNavigationApp()
    const url = NavigationService.generateNavigationUrl(defaultApp, options)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    urls: generateAllUrls(),
    openInApp,
    openDefault,
    getAppDisplayName: NavigationService.getAppDisplayName,
    getDefaultApp: NavigationService.getDefaultNavigationApp
  }
}