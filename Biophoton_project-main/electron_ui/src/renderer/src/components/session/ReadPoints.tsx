import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import lf from '@renderer/assets/images/lf.png'
import lh from '@renderer/assets/images/lh.png'
import rf from '@renderer/assets/images/rf.png'
import rh from '@renderer/assets/images/rh.png'
import { clsx } from 'clsx'
import { pointsLF, pointsLH, pointsRF, pointsRH } from '@renderer/constants/points'
import { Points } from '@shared/types/points'

export function ReadPoints({
  droppingPoints,
  droppingAfterPoints
}: {
  droppingPoints: Points
  droppingAfterPoints: Points
}): React.JSX.Element {
  return (
    <Tabs defaultValue="lh">
      {/* <div className="w-full flex gap-2 justify-between items-center"> */}
      <TabsList>
        <TabsTrigger value="lh">Left Hand</TabsTrigger>
        <TabsTrigger value="rh">Right Hand</TabsTrigger>
        <TabsTrigger value="lf">Left Foot</TabsTrigger>
        <TabsTrigger value="rf">Right Foot</TabsTrigger>
      </TabsList>
      {/* <p className="w-[50%]">{getPointAt(point)?.name}</p>
      </div> */}
      <TabsContent value="lh" className="flex flex-row gap-8 min-h-[427px]">
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={lh} />
          {pointsLH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingPoints.lh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.88}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">BEFORE</p>
        </div>
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={lh} />
          {pointsLH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingAfterPoints.lh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.88}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">AFTER</p>
        </div>
      </TabsContent>
      <TabsContent value="rh" className="flex flex-row gap-8 min-h-[427px]">
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={rh} />
          {pointsRH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingPoints.rh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.88}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">BEFORE</p>
        </div>
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={rh} />
          {pointsRH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingAfterPoints.rh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.88}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">AFTER</p>
        </div>
      </TabsContent>
      <TabsContent value="lf" className="flex flex-row gap-8 min-h-[427px]">
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={lf} />
          {pointsLF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingPoints.lf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.89}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">BEFORE</p>
        </div>
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={lf} />
          {pointsLF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingAfterPoints.lf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.89}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">AFTER</p>
        </div>
      </TabsContent>
      <TabsContent value="rf" className="flex flex-row gap-8 min-h-[427px]">
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={rf} />
          {pointsRF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingPoints.rf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.89}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">BEFORE</p>
        </div>
        <div className="relative w-[370px]">
          <img className="w-full object-contain" src={rf} />
          {pointsRF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-3 h-3 rounded-full',
                droppingAfterPoints.rf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top * 0.89}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          <p className="ml-38 mt-4">AFTER</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}
