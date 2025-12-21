import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import lf from '@renderer/assets/images/lf.png'
import lh from '@renderer/assets/images/lh.png'
import rf from '@renderer/assets/images/rf.png'
import rh from '@renderer/assets/images/rh.png'
import { clsx } from 'clsx'
import { pointsLF, pointsLH, pointsRF, pointsRH } from '@renderer/constants/points'
import { Points } from '@shared/types/points'
import { useSessionStore } from '@renderer/store/sessionStore'

// type Point = {
//   top: number
//   left: number
//   name: string
// }

export function RecordPoints(): React.JSX.Element {
  const isAfter = useSessionStore((state) => state.isAfter)
  const droppingPoints = useSessionStore((state) =>
    isAfter ? state.droppingAfterPoints : state.droppingPoints
  )
  const setDroppingPoints = useSessionStore((state) => state.setDroppingPoints)
  // function getPointAt(index: number): Point | undefined {
  //   return points[index]
  // }
  const onClickPoint = (i: number, key: keyof Points): void => {
    if (droppingPoints[key].includes(i)) {
      setDroppingPoints({ ...droppingPoints, [key]: droppingPoints[key].filter((p) => p != i) })
    } else {
      setDroppingPoints({ ...droppingPoints, [key]: [...droppingPoints[key], i] })
    }
  }
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
      <TabsContent value="lh">
        <div className="relative w-[560px] scale-105 origin-top">
          <img className="w-full object-contain" src={lh} />
          {pointsLH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-4 h-4 rounded-full',
                droppingPoints.lh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onClickPoint(p.id, 'lh')}
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="rh">
        <div className="relative w-[560px] scale-105 origin-top">
          <img className="w-full object-contain" src={rh} />
          {pointsRH.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-4 h-4 rounded-full',
                droppingPoints.rh.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onClickPoint(p.id, 'rh')}
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="lf">
        <div className="relative w-[560px] scale-95 origin-top">
          <img className="w-full object-contain" src={lf} />
          {pointsLF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-4.5 h-4.5 rounded-full',
                droppingPoints.lf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onClickPoint(p.id, 'lf')}
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="rf">
        <div className="relative w-[560px] scale-95 origin-top">
          <img className="w-full object-contain" src={rf} />
          {pointsRF.map((p) => (
            <div
              key={p.id}
              className={clsx(
                'absolute w-4.5 h-4.5 rounded-full',
                droppingPoints.rf.includes(p.id) && 'bg-red-600'
              )}
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onClickPoint(p.id, 'rf')}
            />
          ))}
        </div>
      </TabsContent>
      {/* <div className="flex flex-row justify-center items-center gap-8 mb-4">
        <div
          className={clsx(
            'flex flex-row items-center gap-2 border-b-2 cursor-pointer p-2',
            isDropping ? 'border-primary' : 'border-transparent'
          )}
          onClick={() => toggleDropping(true)}
        >
          Dropping
          <span className="w-2 h-2 bg-red-600 rounded-2xl" />
        </div>
        <div
          className={clsx(
            'flex flex-row items-center gap-2 border-b-2 cursor-pointer p-2',
            isDropping ? 'border-transparent' : 'border-primary'
          )}
          onClick={() => toggleDropping(false)}
        >
          Stable
          <span className="w-2 h-2 bg-green-600 rounded-2xl" />
        </div>
      </div> */}
    </Tabs>
  )
}
