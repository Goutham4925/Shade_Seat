import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings as SettingsIcon, Info, Compass, Navigation, Sun, Shield, MapPin, Route, Moon, Smartphone, Battery, Eye, Download, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useEventTracker } from "@/hooks/useGoogleAnalytics";
import { AppEvents } from "@/lib/analytics";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [isHovered, setIsHovered] = useState(false);
  const trackEvent = useEventTracker();

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
    
    trackEvent(AppEvents.SETTINGS_CHANGED, {
      setting_key: key,
      setting_value: value,
    });
    
    toast.success("Setting updated!", {
      description: "Your preference has been saved automatically.",
    });
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      autoHeading: true,
      showDegrees: true,
      highAccuracy: true,
      darkMode: false,
      vibrationFeedback: true,
      batterySaver: false,
      reducedAnimations: false,
    };

    updateSettings(defaultSettings);
    
    trackEvent('settings_reset', {
      previous_settings: settings,
      new_settings: defaultSettings,
    });
    
    toast.success("Settings reset to defaults!", {
      description: "All preferences have been restored to factory settings.",
    });
  };

  const handleExportSettings = () => {
    try {
      const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(settingsBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sunsafe-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      
      trackEvent('settings_exported', {
        settings_count: Object.keys(settings).length,
      });
      
      toast.success("Settings exported successfully!", {
        description: "Your settings have been downloaded as a JSON file.",
      });
    } catch (error) {
      trackEvent('settings_export_error', {
        error: error.message,
      });
      toast.error("Failed to export settings", {
        description: "Please try again.",
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        
        // Validate imported settings structure
        const validKeys = [
          'autoHeading', 'showDegrees', 'highAccuracy', 'darkMode', 
          'vibrationFeedback', 'batterySaver', 'reducedAnimations'
        ];
        
        const filteredSettings: any = {};
        validKeys.forEach(key => {
          if (key in importedSettings && typeof importedSettings[key] === 'boolean') {
            filteredSettings[key] = importedSettings[key];
          }
        });

        if (Object.keys(filteredSettings).length === 0) {
          throw new Error('No valid settings found in file');
        }

        updateSettings(filteredSettings);
        
        trackEvent('settings_imported', {
          imported_settings_count: Object.keys(filteredSettings).length,
          settings: filteredSettings,
        });
        
        toast.success("Settings imported successfully!", {
          description: "Your preferences have been updated.",
        });
      } catch (error) {
        trackEvent('settings_import_error', {
          error: error.message,
        });
        toast.error("Invalid settings file", {
          description: "Please check the file format and try again.",
        });
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  const getCurrentLocationSettings = () => {
    if (!navigator.permissions) {
      toast.info("Permission API not supported", {
        description: "Cannot check location permissions in this browser.",
      });
      return;
    }

    trackEvent('location_permission_check_requested');

    navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        const status = result.state;
        let description = "";
        
        switch (status) {
          case 'granted':
            description = "Location access is fully enabled";
            break;
          case 'denied':
            description = "Location access is blocked. Please enable it in browser settings.";
            break;
          case 'prompt':
            description = "Location access will be requested when needed";
            break;
        }

        trackEvent('location_permission_status', {
          status,
        });

        toast.info(`Location permission: ${status}`, { description });
      })
      .catch(() => {
        trackEvent('location_permission_check_error');
        toast.info("Location permission status unavailable", {
          description: "Cannot determine location access status.",
        });
      });
  };

  const settingGroups = [
    {
      title: "Location & Direction",
      icon: <Compass className="w-5 h-5" />,
      settings: [
        {
          id: "auto-heading",
          label: "Auto-detect Heading",
          description: "Use device compass for automatic direction detection",
          value: settings.autoHeading,
          onChange: (value: boolean) => handleSettingChange('autoHeading', value),
          icon: <Compass className="w-6 h-6" />,
          color: "blue"
        },
        {
          id: "show-degrees",
          label: "Show Degree Measurements",
          description: "Display precise degree measurements and bearings",
          value: settings.showDegrees,
          onChange: (value: boolean) => handleSettingChange('showDegrees', value),
          icon: <Navigation className="w-6 h-6" />,
          color: "green"
        },
        {
          id: "high-accuracy",
          label: "High Accuracy Mode",
          description: "Use more precise location services (may use more battery)",
          value: settings.highAccuracy,
          onChange: (value: boolean) => handleSettingChange('highAccuracy', value),
          icon: <Shield className="w-6 h-6" />,
          color: "amber"
        }
      ]
    },
    {
      title: "Appearance & Accessibility",
      icon: <Eye className="w-5 h-5" />,
      settings: [
        {
          id: "dark-mode",
          label: "Dark Mode",
          description: "Switch to dark theme for better visibility",
          value: settings.darkMode,
          onChange: (value: boolean) => handleSettingChange('darkMode', value),
          icon: <Moon className="w-6 h-6" />,
          color: "purple"
        },
        {
          id: "reduced-animations",
          label: "Reduced Animations",
          description: "Minimize animations for better performance and accessibility",
          value: settings.reducedAnimations,
          onChange: (value: boolean) => handleSettingChange('reducedAnimations', value),
          icon: <Eye className="w-6 h-6" />,
          color: "indigo"
        }
      ]
    },
    {
      title: "Device & Performance",
      icon: <Smartphone className="w-5 h-5" />,
      settings: [
        {
          id: "vibration-feedback",
          label: "Vibration Feedback",
          description: "Provide haptic feedback for interactions (where supported)",
          value: settings.vibrationFeedback,
          onChange: (value: boolean) => handleSettingChange('vibrationFeedback', value),
          icon: <Smartphone className="w-6 h-6" />,
          color: "gray"
        },
        {
          id: "battery-saver",
          label: "Battery Saver Mode",
          description: "Reduce background activity to save battery life",
          value: settings.batterySaver,
          onChange: (value: boolean) => handleSettingChange('batterySaver', value),
          icon: <Battery className="w-6 h-6" />,
          color: "green"
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string; switch: string } } = {
      blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", switch: "data-[state=checked]:bg-blue-500" },
      green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", switch: "data-[state=checked]:bg-green-500" },
      amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", switch: "data-[state=checked]:bg-amber-500" },
      purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", switch: "data-[state=checked]:bg-purple-500" },
      indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", switch: "data-[state=checked]:bg-indigo-500" },
      gray: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", switch: "data-[state=checked]:bg-gray-500" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 relative">
      <div className="max-w-md mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-4 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3">
            Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
            Customize Your Experience
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
            Tailor the app to your preferences and needs
          </p>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6 mb-8">
          {settingGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-6 animate-slide-up">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-gray-100 to-transparent dark:from-gray-700 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative z-10">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {group.icon}
                  </div>
                  <span>{group.title}</span>
                </h3>
                
                <div className="space-y-4">
                  {group.settings.map((setting, index) => {
                    const colorClasses = getColorClasses(setting.color);
                    return (
                      <div key={setting.id}>
                        {index > 0 && <div className="border-t border-gray-200 dark:border-gray-600/60" />}
                        <div className="flex items-center justify-between py-4 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-300 group">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorClasses.bg} ${colorClasses.text} group-hover:scale-110 transition-transform`}>
                              {setting.icon}
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={setting.id} className="text-base font-semibold text-gray-900 dark:text-white block mb-1">
                                {setting.label}
                              </Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {setting.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={setting.id}
                            checked={setting.value}
                            onCheckedChange={setting.onChange}
                            className={`scale-110 ${colorClasses.switch}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Enhanced App Info Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-blue-100 to-transparent dark:from-blue-900/20 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">About Shade Safe</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Version 1.0.0 • Built with for commuters
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Shade Safe helps commuters find the optimal seat to avoid direct sunlight using real-time sun position calculations and smart direction detection.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">GPS Location</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800 transition-all hover:bg-green-100 dark:hover:bg-green-900/30 group">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Compass</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30 group">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sun Position</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-100 dark:border-purple-800 transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30 group">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Privacy First</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-1 gap-3 mb-4 animate-fade-in-up">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 transition-all group"
            onClick={handleResetSettings}
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Reset All</span>
            </div>
          </Button>
          
          {/* <Button 
            variant="outline"
            className="rounded-2xl h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 transition-all group"
            onClick={handleExportSettings}
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </div>
          </Button> */}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6 animate-fade-in-up">
          <label htmlFor="import-settings" className="w-full">
            {/* <Button 
              variant="outline"
              className="rounded-2xl h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 transition-all group w-full cursor-pointer"
              asChild
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import Settings</span>
              </div>
            </Button> */}
          </label>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>

        {/* Permissions Check */}
        <div className="text-center animate-fade-in-up mb-6">
          <div className="inline-flex items-start gap-4 px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 max-w-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 flex-shrink-0">
              🔒
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Privacy & Permissions</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed mb-2">
                This app requires location and compass access for accurate recommendations. All data is processed locally on your device.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-black  px-2 h-6 text-xs"
                onClick={getCurrentLocationSettings}
              >
                Check Location Permissions
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Status Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100 dark:border-gray-700">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Settings Active
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Changes applied automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;